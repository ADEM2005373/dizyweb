const DocumentCommerciaux = require('../models/DocumentCommerciaux');
const Client = require('../models/Client');
const User = require('../models/User'); // For Agent
const pdfGenerator = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');

exports.createDocument = async (req, res) => {
  try {
    const { typeDocument, clientId, items, tva, agentId, isCustomRequest, clientSuggestion } = req.body;
    console.log("CreateDocument Body:", JSON.stringify(req.body, null, 2));

    // 0. Handle Custom Request (Early Exit)
    if (isCustomRequest) {
      const newDoc = new DocumentCommerciaux({
        reference: 'DVI-TEMP-' + Date.now(), // Temporary Ref
        typeDocument: 'DEVIS', // Always start as Quote for custom requests
        clientId,
        agentId: agentId || req.user.id,
        isCustomRequest: true,
        clientSuggestion,
        statut: 'EN_ATTENTE_AGENT',
        // Minimal defaults
        items: [],
        montantHT: 0,
        montantTTC: 0,
        clientDetailsSnapshot: {} // Will be filled later
      });
      await newDoc.save();
      return res.status(201).json(newDoc);
    }

    // 1. Fetch Client for Snapshot
    let client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: "Client non trouvé" });

    // Update Client Info if provided (RIB/Matricule from request)
    if (req.body.rib || req.body.matriculeFiscale) {
      client.rib = req.body.rib || client.rib;
      client.matriculeFiscale = req.body.matriculeFiscale || client.matriculeFiscale;
      await client.save();
    }

    // 2. Fetch Agent
    // If agentId is not passed, use req.user.id (assuming auth middleware)
    const agentRef = agentId || req.user.id;
    // Verify agent exists? Optional.

    // 3. Calculate Totals
    let montantHT = 0;
    const processedItems = items.map(item => {
      const q = Number(item.quantite) || 1;
      const p = Number(item.prixUnitaire) || 0;
      const totalLine = q * p;
      montantHT += totalLine;
      return {
        ...item,
        quantite: q,
        prixUnitaire: p,
        totalHT: totalLine
      };
    });

    const vatRate = Number(tva) || 0;
    const montantTTC = montantHT * (1 + vatRate / 100);

    // 4. Generate Reference
    const year = new Date().getFullYear();
    const count = await DocumentCommerciaux.countDocuments({
      typeDocument,
      createdAt: { $gte: new Date(year, 0, 1) }
    });
    const refPrefix = typeDocument === 'FACTURE' ? 'FCT' : 'DVI';
    const reference = `${refPrefix}-${year}/${String(count + 1).padStart(4, '0')}`;

    // 5. Create Document
    const newDoc = new DocumentCommerciaux({
      reference,
      typeDocument,
      clientId,
      agentId: agentRef,
      items: processedItems,
      montantHT,
      tva: vatRate,
      montantTTC,
      clientDetailsSnapshot: {
        nom: client.nom || '',
        prenom: client.prenom || '',
        entreprise: client.entreprise || '',
        adresse: client.adresse || '',
        matricule: client.matriculeFiscale || '',
        rib: client.rib || '',
        email: client.email || '',
        telephone: client.telephone || ''
      }
    });

    await newDoc.save();

    // 6. Generate PDF Immediately
    const filename = `${reference.replace('/', '_')}.pdf`;
    const outputPath = path.join(__dirname, '../uploads/documents', filename);

    // Load full agent and client info for PDF
    // Ensure agent is populated
    const fullDoc = await DocumentCommerciaux.findById(newDoc._id)
      .populate('agentId')
      .populate('clientId'); // Also populate client just in case

    // Double check agent fields presence
    if (!fullDoc.agentId) {
      console.warn("WARNING: Agent ID not found for PDF generation");
    }

    await pdfGenerator.generatePDF(fullDoc, outputPath);

    // Update path
    fullDoc.pdfPath = `/uploads/documents/${filename}`;
    await fullDoc.save();

    res.status(201).json(fullDoc);

  } catch (error) {
    console.error("CreateDocument ERROR:", error);
    res.status(500).json({ message: "Erreur lors de la création du document", error: error.message });
  }
};

exports.getAllDocuments = async (req, res) => {
  try {
    const { agent, client } = req.query;
    let query = {};
    if (agent) query.agentId = agent;
    if (client) query.clientId = client;

    const docs = await DocumentCommerciaux.find(query)
      .populate('clientId', 'nom prenom entreprise')
      .populate('agentId', 'nom prenom')
      .sort({ createdAt: -1 });

    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: "Erreur lecture documents" });
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const doc = await DocumentCommerciaux.findById(req.params.id)
      .populate('clientId')
      .populate('agentId');
    if (!doc) return res.status(404).json({ message: "Non trouvé" });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: "Erreur lecture document" });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    await DocumentCommerciaux.findByIdAndDelete(req.params.id);
    res.json({ message: "Supprimé" });
  } catch (e) { res.status(500).json({ message: "Erreur suppression" }); }
};

exports.agentSubmitProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { prixPropose, description, details } = req.body;

    const doc = await DocumentCommerciaux.findById(id);
    if (!doc) return res.status(404).json({ message: "Document non trouvé" });

    doc.agentProposal = {
      prixPropose,
      description,
      details
    };
    doc.statut = 'EN_ATTENTE_ADMIN';
    doc.adminApprovalStatus = 'PENDING';

    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Erreur proposal", error: err.message });
  }
};

exports.adminApproveProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, reason, templateId } = req.body; // templateId for generating PDF

    const doc = await DocumentCommerciaux.findById(id).populate('clientId');
    if (!doc) return res.status(404).json({ message: "Document non trouvé" });

    if (!approved) {
      doc.statut = 'REFUSE';
      doc.adminApprovalStatus = 'REJECTED';
      await doc.save();
      return res.json(doc);
    }

    // Apply Proposal to Items
    doc.items = [{
      reference: 'SUR-MESURE',
      description: doc.agentProposal.description || 'Service Sur Mesure',
      quantite: 1,
      prixUnitaire: doc.agentProposal.prixPropose || 0,
      totalHT: doc.agentProposal.prixPropose || 0
    }];

    doc.montantHT = Number(doc.agentProposal.prixPropose) || 0;
    doc.tva = 20; // Default or passed
    doc.montantTTC = doc.montantHT * 1.2;

    // Generate Real Reference
    const year = new Date().getFullYear();
    const count = await DocumentCommerciaux.countDocuments({
      typeDocument: 'DEVIS',
      createdAt: { $gte: new Date(year, 0, 1) }
    });
    doc.reference = `DVI-${year}/${String(count + 1).padStart(4, '0')}`;

    // Fill Snapshot
    doc.clientDetailsSnapshot = {
      nom: doc.clientId.nom || '',
      prenom: doc.clientId.prenom || '',
      entreprise: doc.clientId.entreprise || '',
      email: doc.clientId.email || '',
      rib: doc.clientId.rib || '',
      matricule: doc.clientId.matriculeFiscale || '',
      adresse: doc.clientId.adresse || '',
      telephone: doc.clientId.telephone || ''
    };

    doc.statut = 'APPROUVE';
    doc.adminApprovalStatus = 'APPROVED';

    // Generate PDF
    const filename = `${doc.reference.replace('/', '_')}.pdf`;
    const outputPath = path.join(__dirname, '../uploads/documents', filename);

    // Assuming pdfGenerator uses 'items' and 'clientDetailsSnapshot'
    await pdfGenerator.generatePDF(doc, outputPath);
    doc.pdfPath = `/uploads/documents/${filename}`;

    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error("Admin Approve Error", err);
    res.status(500).json({ message: "Erreur approbation", error: err.message });
  }
};

exports.markAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await DocumentCommerciaux.findById(id);
    if (!doc) return res.status(404).json({ message: "Document non trouvé" });

    // Check if approved
    if (doc.statut !== 'APPROUVE') {
      return res.status(400).json({ message: "Seuls les documents approuvés peuvent être terminés" });
    }

    doc.statut = 'TERMINE';
    await doc.save();
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: "Erreur lors de la validation finale" });
  }
};

exports.agentValidateStandard = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await DocumentCommerciaux.findById(id).populate('clientId');
    if (!doc) return res.status(404).json({ message: "Doc introuvable" });

    if (doc.isCustomRequest) return res.status(400).json({ message: "Utilisez le flux de proposition pour les demandes sur mesure" });

    // Update Snapshot
    if (doc.clientId) {
      doc.clientDetailsSnapshot = {
        nom: doc.clientId.nom || '',
        prenom: doc.clientId.prenom || '',
        entreprise: doc.clientId.entreprise || '',
        adresse: doc.clientId.adresse || '',
        matricule: doc.clientId.matriculeFiscale || '',
        rib: doc.clientId.rib || '',
        email: doc.clientId.email || '',
        telephone: doc.clientId.telephone || ''
      };
    }

    // Recalculate Totals
    let montantHT = 0;
    doc.items.forEach(item => {
      const lineTotal = (Number(item.quantite) || 0) * (Number(item.prixUnitaire) || 0);
      // Update item totalLine property if exists, or just sum up
      montantHT += lineTotal;
    });
    const vat = Number(doc.tva) || 0;

    doc.montantHT = montantHT;
    doc.montantTTC = montantHT * (1 + vat / 100);

    doc.statut = 'APPROUVE';
    doc.adminApprovalStatus = 'APPROVED';

    // Save calculation before generating PDF
    await doc.save();

    // REGENERATE PDF
    const filename = `${doc.reference.replace('/', '_')}.pdf`;
    const outputPath = path.join(__dirname, '../uploads/documents', filename);

    // Populate agent
    if (!doc.agentId) doc.agentId = req.user.id;
    // Reload doc to ensure all virtuals/fields are fresh
    const freshDoc = await DocumentCommerciaux.findById(doc._id)
      .populate('clientId')
      .populate('agentId');

    await pdfGenerator.generatePDF(freshDoc, outputPath);
    freshDoc.pdfPath = `/uploads/documents/${filename}`;

    await freshDoc.save();

    res.json(freshDoc);
  } catch (e) {
    console.error("Agent Validate Error:", e);
    res.status(500).json({ message: "Erreur validation agent" });
  }
};
