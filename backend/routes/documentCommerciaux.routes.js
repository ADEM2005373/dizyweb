const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentCommerciaux.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middlewares");

// Créer un document → admin, agent ou client (pour les demandes)
router.post("/", verifyToken, authorizeRoles("admin", "agent", "client"), documentController.createDocument);

// Récupérer tous les documents → admin, agent ou client
router.get("/", verifyToken, authorizeRoles("admin", "agent", "client"), documentController.getAllDocuments);

// Récupérer un document par ID -> accessible à tous les rôles autorisés
router.get("/:id", verifyToken, authorizeRoles("admin", "agent", "client"), documentController.getDocumentById);

// Mettre à jour un document → admin ou agent
router.put("/:id", verifyToken, authorizeRoles("admin", "agent"), documentController.updateDocument);

// Supprimer un document → admin uniquement
router.delete("/:id", verifyToken, authorizeRoles("admin"), documentController.deleteDocument);

module.exports = router;
