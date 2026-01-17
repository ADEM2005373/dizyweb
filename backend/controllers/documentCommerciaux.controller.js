const DocumentCommerciaux = require('../models/DocumentCommerciaux');
const Client = require('../models/Client');
const User = require('../models/User'); // For Agent
const pdfGenerator = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');

exports.createDocument = async (req, res) => {
  try {
    const { typeDocument, clientId, items, tva, agentId } = req.body;
    console.log("CreateDocument Body:", JSON.stringify(req.body, null, 2));

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
      const totalLine = item.quantite * item.prixUnitaire;
      montantHT += totalLine;
      return { ...item, totalHT: totalLine };
    });

    const montantTTC = montantHT * (1 + (tva || 0) / 100);

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
      tva: tva || 0,
      montantTTC,
      clientDetailsSnapshot: {
        nom: client.nom,
        entreprise: client.entreprise,
        adresse: client.adresse || '',
        matricule: client.matriculeFiscale || '',
        rib: client.rib || '', // Captured here!
        email: client.email || '',
        telephone: client.telephone || ''
      }
    });

    await newDoc.save();

    // 6. Generate PDF Immediately
    const filename = `${reference.replace('/', '_')}.pdf`;
    const outputPath = path.join(__dirname, '../uploads/documents', filename);

    // Load full agent info for PDF
    const fullDoc = await DocumentCommerciaux.findById(newDoc._id).populate('agentId');

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
