const express = require("express");
const router = express.Router();
const rendezVousController = require("../controllers/rendezvous.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middlewares");

// Créer un rendez-vous → accessible aux admin, agents et clients
router.post("/", verifyToken, authorizeRoles("admin", "agent", "client"), rendezVousController.createRendezVous);

// Récupérer tous les rendez-vous → accessible aux admin, agents et clients
router.get("/", verifyToken, authorizeRoles("admin", "agent", "client"), rendezVousController.getAllRendezVous);

// Récupérer un rendez-vous par ID → accessible aux admin, agents et clients
router.get("/:id", verifyToken, authorizeRoles("admin", "agent", "client"), rendezVousController.getRendezVousById);

// Mettre à jour un rendez-vous → accessible aux admin, agents et clients
router.put("/:id", verifyToken, authorizeRoles("admin", "agent", "client"), rendezVousController.updateRendezVous);

// Supprimer un rendez-vous → accessible uniquement aux admin
router.delete("/:id", verifyToken, authorizeRoles("admin"), rendezVousController.deleteRendezVous);

module.exports = router;
