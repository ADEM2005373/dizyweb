const Pack = require("../models/Pack");

// =======================
// CREATE PACK
// =======================
exports.createPack = async (req, res) => {
  try {
    const { titre, description, type, prix, prixHT, tva, actif } = req.body;

    if (!titre || !description || !type || prix === undefined || actif === undefined) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const pack = await Pack.create({
      titre,
      description,
      type,
      prix,
      prixHT: prixHT || 0,
      tva: tva || 20,
      actif,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: "Pack créé avec succès",
      pack
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// CUSTOM PACK FLOW
// =======================

exports.createCustomPack = async (req, res) => {
  try {
    const { clientRequest } = req.body;
    // Client suggests a service -> simplified Pack
    const pack = await Pack.create({
      titre: 'Service Personnalisé',
      description: 'En attente de proposition',
      type: 'service',
      prix: 0,
      actif: true,
      isCustom: true,
      private: true,
      clientId: req.user.id,
      clientRequest,
      status: 'PENDING_AGENT'
    });
    res.status(201).json(pack);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updatePackProposal = async (req, res) => {
  try {
    const { id } = req.params; // Pack ID
    const { prixPropose, description, details } = req.body;

    const pack = await Pack.findById(id);
    if (!pack) return res.status(404).json({ message: "Pack introuvable" });

    pack.agentProposal = { prixPropose, description, details };
    pack.status = 'PENDING_ADMIN';

    await pack.save();
    res.json(pack);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.approvePack = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, titre, description, prix } = req.body;

    const pack = await Pack.findById(id);
    if (!pack) return res.status(404).json({ message: "Pack introuvable" });

    if (approved) {
      pack.status = 'APPROVED';
      // Use overrides if provided, otherwise fallback to agent proposal
      pack.titre = titre || pack.agentProposal.description || 'Service Sur Mesure';
      pack.description = description || (pack.agentProposal.details || 'Service spécifique') + ` (Basé sur demande: ${pack.clientRequest})`;

      const finalPrice = prix !== undefined ? prix : pack.agentProposal.prixPropose;
      pack.prix = finalPrice;
      pack.prixHT = finalPrice; // Assuming HT input
      pack.tva = 20;
    } else {
      pack.status = 'REJECTED';
    }

    await pack.save();
    res.json(pack);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// =======================
// GET ALL PACKS
// =======================
exports.getAllPacks = async (req, res) => {
  try {
    const { role, id } = req.user || {}; // Assuming Auth Middleware populates this
    console.log("getAllPacks User:", req.user);

    // Default Query: Handle missing 'private' field for legacy packs using $ne: true
    let query = { private: { $ne: true }, actif: true };

    // If Admin/Agent, see everything (or filter by request)
    if (role === 'admin' || role === 'agent') {
      const { status } = req.query;
      query = {}; // Reset default
      if (status) query.status = status;
    }
    // If Client, see Public + Own Private Approved (or all own if needed)
    else if (role === 'client') {
      query = {
        $or: [
          { private: { $ne: true }, actif: true }, // Include if private is false OR missing
          { clientId: id } // Simply show all packs belonging to this client (Custom, approved or pending)
        ]
      };
    }

    const packs = await Pack.find(query).populate("createdBy", "nom prenom email").populate("clientId", "nom prenom entreprise");
    console.log(`getAllPacks found ${packs.length} packs for role ${role}`);
    console.log("Query used:", JSON.stringify(query));
    res.status(200).json(packs);
  } catch (error) {
    console.error("CRITICAL ERROR in getAllPacks:", error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// GET PACK BY ID
// =======================
exports.getPackById = async (req, res) => {
  try {
    const pack = await Pack.findById(req.params.id)
      .populate("createdBy", "nom prenom email");

    if (!pack) {
      return res.status(404).json({ message: "Pack non trouvé" });
    }

    res.status(200).json(pack);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// UPDATE PACK
// =======================
exports.updatePack = async (req, res) => {
  try {
    const pack = await Pack.findById(req.params.id);
    if (!pack) {
      return res.status(404).json({ message: "Pack non trouvé" });
    }

    const { titre, description, type, prix, prixHT, tva, actif } = req.body;

    if (titre !== undefined) pack.titre = titre;
    if (description !== undefined) pack.description = description;
    if (type !== undefined) pack.type = type;
    if (prix !== undefined) pack.prix = prix;
    if (prixHT !== undefined) pack.prixHT = prixHT;
    if (tva !== undefined) pack.tva = tva;
    if (actif !== undefined) pack.actif = actif;

    await pack.save();

    res.status(200).json({
      message: "Pack mis à jour avec succès",
      pack
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// DELETE PACK
// =======================
exports.deletePack = async (req, res) => {
  try {
    const pack = await Pack.findById(req.params.id);
    if (!pack) {
      return res.status(404).json({ message: "Pack non trouvé" });
    }

    await pack.deleteOne();

    res.status(200).json({ message: "Pack supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
