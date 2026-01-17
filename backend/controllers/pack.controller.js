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
// GET ALL PACKS
// =======================
exports.getAllPacks = async (req, res) => {
  try {
    const packs = await Pack.find().populate("createdBy", "nom prenom email");
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
