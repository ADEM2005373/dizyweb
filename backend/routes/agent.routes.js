// backend/routes/agent.routes.js
const express = require("express");
const router = express.Router();
const agentController = require("../controllers/agent.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middlewares");

// =======================
// ROUTES AGENTS
// =======================

// Créer un agent → accessible uniquement aux admin
router.post("/", verifyToken, authorizeRoles("admin"), agentController.createAgent);

// Récupérer tous les agents → accessible aux admin et agents
router.get("/", verifyToken, authorizeRoles("admin", "agent"), agentController.getAllAgents);

// Récupérer mes clients → accessible aux agents
router.get("/my-clients", verifyToken, authorizeRoles("agent"), agentController.getMyClients);

// Récupérer un agent par ID → accessible aux admin et agents
router.get("/:id", verifyToken, authorizeRoles("admin", "agent"), agentController.getAgentById);

// Mettre à jour un agent → accessible uniquement aux admin
router.put("/:id", verifyToken, authorizeRoles("admin"), agentController.updateAgent);

module.exports = router;
