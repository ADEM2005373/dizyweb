const express = require("express");
const router = express.Router();
const packController = require("../controllers/pack.controller");
const { verifyToken, authorizeRoles, verifyTokenOptional } = require("../middlewares/auth.middlewares");

// =======================
// ROUTES PACK
// =======================

// Créer un pack → admin uniquement
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  packController.createPack
);

// Récupérer tous les packs → admin & client
router.get(
  "/",
  verifyTokenOptional,
  packController.getAllPacks
);

// Récupérer un pack par ID → admin & client
router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "client"),
  packController.getPackById
);

// Mettre à jour un pack → admin uniquement
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  packController.updatePack
);

// Supprimer un pack → admin uniquement
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  packController.deletePack
);

// Custom Pack Flow
router.post('/custom', verifyToken, packController.createCustomPack);
router.put('/:id/proposal', verifyToken, authorizeRoles("agent", "admin"), packController.updatePackProposal);
router.put('/:id/approve', verifyToken, authorizeRoles("admin"), packController.approvePack);

module.exports = router;
