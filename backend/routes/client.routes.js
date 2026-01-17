// backend/routes/client.routes.js
const express = require("express");
const router = express.Router();
const clientController = require("../controllers/client.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middlewares");

// =======================
// ROUTES CLIENTS
// =======================

// Créer un client → accessible uniquement aux admin et agents
router.post("/", verifyToken, authorizeRoles("admin", "agent"), clientController.createClient);

// Récupérer tous les clients → accessible uniquement aux admin et agents
router.get("/", verifyToken, authorizeRoles("admin", "agent"), clientController.getAllClients);

// Récupérer un client par ID → accessible uniquement aux admin et agents
router.get("/:id", verifyToken, authorizeRoles("admin", "agent"), clientController.getClientById);

// Mettre à jour un client → accessible uniquement aux admin et agents
router.put("/:id", verifyToken, authorizeRoles("admin", "agent"), clientController.updateClient);

// Mettre à jour les réseaux sociaux d'un client → accessible aux admin et agents assignés
router.put("/:id/social-links", verifyToken, authorizeRoles("admin", "agent"), clientController.updateClientSocialLinks);

module.exports = router;
