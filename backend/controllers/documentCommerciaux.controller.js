const DocumentCommerciaux = require("../models/DocumentCommerciaux");
const TemplateDocument = require("../models/TemplateDocument");
const User = require("../models/User");
const pdfGenerator = require("../utils/pdfGenerator"); // pas besoin de destructuring
const path = require("path");

const generateReference = async (type) => {
  const prefix = type === "FACTURE" ? "FACT" : "DEVIS";
  const year = new Date().getFullYear();

  // Find the last document of this type and year
  const lastDoc = await DocumentCommerciaux.findOne({
    typeDocument: type,
    reference: new RegExp(`^${prefix}-${year}-`)
  }).sort({ reference: -1 });

  let sequence = 1;
  if (lastDoc && lastDoc.reference) {
    const parts = lastDoc.reference.split("-");
    const lastSeq = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastSeq)) sequence = lastSeq + 1;
  }

  return `${prefix}-${year}-${sequence.toString().padStart(4, "0")}`;
};

// =======================
// CRÉER un document commercial
// =======================
exports.createDocument = async (req, res) => {
  try {
    const { clientId, typeDocument } = req.body;
    const userRole = req.user.role;

    // Validation: Only clients can create DEVIS requests
    if (userRole === 'client' && typeDocument === 'DEVIS') {
      // Check if the client exists
      const client = await User.findById(clientId);

      if (!client || client.role !== 'Client') {
        return res.status(404).json({ message: "Client non trouvé" });
      }

      // Ensure the client can only create documents for themselves
      if (clientId !== req.user.id) {
        return res.status(403).json({ message: "Vous ne pouvez créer des documents que pour votre propre compte" });
      }
    }

    const doc = await DocumentCommerciaux.create(req.body);

    // Create notification for admins/agents when client requests a quote
    if (userRole === 'client' && typeDocument === 'DEVIS') {
      try {
        const Notification = require("../models/Notification");
        await Notification.create({
          message: `COMMANDE: ${client.nom} ${client.prenom} (${client.entreprise}) demande un devis pour "${req.body.commentaire || 'Service demandé'}"`,
          lu: false,
          date: new Date()
        });
        console.log('Notification created for client quote request');
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the document creation if notification fails
      }
    }

    res.status(201).json({ message: "Document commercial créé", doc });
  } catch (error) {
    console.error('Document creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// RÉCUPÉRER tous les documents
// =======================
exports.getAllDocuments = async (req, res) => {
  try {
    const { client, agent } = req.query;
    let query = {};
    if (client) query.clientId = client;
    if (agent) query.agentId = agent;

    // Restriction for Agents: User requested "tout les livrable de tout les client" (all deliverables of all clients)
    // So we DO NOT filter by assigned clients for agents here. 
    // They can see everything.
    /* 
    if (req.user && req.user.role === "agent") {
      // Get clients assigned to this agent
      const agentClients = await User.find({ role: 'Client', agentPrincipal: req.user.id }).select('_id');
      const clientIds = agentClients.map(c => c._id);
      query.clientId = { $in: clientIds };
    }
    */

    // Restriction for Clients: only see approved documents for themselves
    if (req.user && req.user.role === "client") {
      query.statut = "APPROUVE";
      query.clientId = req.user.id;
    }

    const docs = await DocumentCommerciaux.find(query)
      .populate("clientId", "nom prenom entreprise secteur")
      .populate("agentId", "nom prenom specialite")
      .populate("serviceId", "titre type prix")
      .populate("templateId", "nom description");
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// RÉCUPÉRER un document par ID
// =======================
exports.getDocumentById = async (req, res) => {
  try {
    const doc = await DocumentCommerciaux.findById(req.params.id)
      .populate("clientId", "nom prenom entreprise secteur")
      .populate("agentId", "nom prenom specialite")
      .populate("serviceId", "titre type prix")
      .populate("templateId", "nom description");
    if (!doc) return res.status(404).json({ message: "Document non trouvé" });
    res.status(200).json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// METTRE À JOUR un document
// =======================
exports.updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier si le document existe
    const oldDoc = await DocumentCommerciaux.findById(id);
    if (!oldDoc) return res.status(404).json({ message: "Document non trouvé" });

    // Si le statut change à APPROUVE ou si on régénère le PDF explicitement
    if (updateData.statut === "APPROUVE" && (oldDoc.statut !== "APPROUVE" || updateData.regeneratePDF)) {

      // Générer la référence si nécessaire
      if (!oldDoc.reference && !updateData.reference) {
        updateData.reference = await generateReference(oldDoc.typeDocument);
      }

      // Gestion du statut de paiement
      if (oldDoc.typeDocument === "DEVIS") {
        updateData.statutPaiement = "SANS_OBJET";
      } else if (!oldDoc.statutPaiement || oldDoc.statutPaiement === "SANS_OBJET") {
        updateData.statutPaiement = "NON_PAYE";
      }

      // Récupérer ou définir le template
      // Enforce Fixed Template based on Type
      // Ignore database templates, user file based system
      const isFacture = oldDoc.typeDocument === "FACTURE";
      const fixedTemplatePath = isFacture
        ? "uploads/templates/fct_2026_0001.pdf"
        : "uploads/templates/dvi_2026_0001.pdf";

      const template = {
        typeTemplate: 'PDF',
        pdfTemplatePath: fixedTemplatePath,
        nom: isFacture ? "Modele Facture Fixe" : "Modele Devis Fixe"
      };

      console.log(`Generating PDF using fixed template: ${fixedTemplatePath}`);

      // Préparer les données pour le PDF
      const fullDoc = await DocumentCommerciaux.findById(id)
        .populate("clientId")
        .populate("agentId")
        .populate("serviceId");

      const dataForPDF = {
        document_type: fullDoc.typeDocument,
        reference: updateData.reference || fullDoc.reference,
        client_nom: fullDoc.clientId?.nom || "Client",
        client_prenom: fullDoc.clientId?.prenom || "",
        client_entreprise: fullDoc.clientId?.entreprise || "N/A",
        agent_nom: fullDoc.agentId?.nom || "Agent",
        agent_prenom: fullDoc.agentId?.prenom || "",
        montant_ht: updateData.montantHT || fullDoc.montantHT || 0,
        tva: updateData.tva || fullDoc.tva || 20,
        montant_ttc: updateData.montantTTC || fullDoc.montantTTC || 0,
        date: new Date().toLocaleDateString('fr-FR'),
        commentaire: updateData.commentaire || fullDoc.commentaire || ""
      };

      // Calcul automatique du montant TTC/HT si nécessaire
      if (dataForPDF.montant_ttc === 0 && dataForPDF.montant_ht > 0) {
        dataForPDF.montant_ttc = dataForPDF.montant_ht * (1 + dataForPDF.tva / 100);
      } else if (dataForPDF.montant_ht === 0 && dataForPDF.montant_ttc > 0) {
        dataForPDF.montant_ht = dataForPDF.montant_ttc / (1 + dataForPDF.tva / 100);
      }

      updateData.montantHT = dataForPDF.montant_ht;
      updateData.montantTTC = dataForPDF.montant_ttc;
      updateData.tva = dataForPDF.tva;
      updateData.dateValidation = new Date();

      // Nom du fichier et chemin de sortie
      const fileName = `${updateData.reference || id}.pdf`.replace(/\//g, "-");
      const outputPath = path.join(__dirname, "../uploads/documents", fileName);

      // Ensure directory exists
      const fs = require("fs");
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      // 🔹 Nouveau PDF generator (PDF-only)
      const pdfBuffer = await pdfGenerator.generateFromPDFTemplate(template, dataForPDF);

      fs.writeFileSync(outputPath, pdfBuffer);
      updateData.pdfPath = `/uploads/documents/${fileName}`;
    }

    const doc = await DocumentCommerciaux.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({
      message: "Document mis à jour " + (updateData.statut === "APPROUVE" ? "et PDF généré" : ""),
      doc
    });

  } catch (error) {
    console.error("Update Doc Error:", error);
    res.status(500).json({ message: error.message });
  }
};


// =======================
// SUPPRIMER un document
// =======================
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await DocumentCommerciaux.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document non trouvé" });
    res.status(200).json({ message: "Document supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
