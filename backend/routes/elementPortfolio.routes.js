const express = require("express");
const router = express.Router();
const elementPortfolioController = require("../controllers/elementPortfolio.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middlewares");
const upload = require("../middlewares/upload");

// Créer un élément → admin ou agent. Supporte l'upload de fichier ou l'URL simple.
router.post("/", verifyToken, authorizeRoles("admin", "agent"), upload.single('file'), elementPortfolioController.createElementPortfolio);

// Récupérer tous les éléments → admin, agent ou client
router.get("/", verifyToken, authorizeRoles("admin", "agent", "client"), elementPortfolioController.getAllElementsPortfolio);

// Récupérer un élément par ID -> admin, agent ou client
router.get("/:id", verifyToken, authorizeRoles("admin", "agent", "client"), elementPortfolioController.getElementPortfolioById);

// Mettre à jour un élément → admin ou agent
router.put("/:id", verifyToken, authorizeRoles("admin", "agent"), elementPortfolioController.updateElementPortfolio);

// Supprimer un élément → admin uniquement
router.delete("/:id", verifyToken, authorizeRoles("admin"), elementPortfolioController.deleteElementPortfolio);

module.exports = router;
