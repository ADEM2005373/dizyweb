const express = require("express");
const router = express.Router();
const portfolioController = require("../controllers/portfolio.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middlewares");

// Créer un portfolio → admin ou agent
router.post("/", verifyToken, authorizeRoles("admin", "agent"), portfolioController.createPortfolio);

// Récupérer tous les portfolios → admin, agent ou client
router.get("/", verifyToken, authorizeRoles("admin", "agent", "client"), portfolioController.getAllPortfolios);

// Récupérer un portfolio par ID -> admin, agent ou client
router.get("/:id", verifyToken, authorizeRoles("admin", "agent", "client"), portfolioController.getPortfolioById);

// Mettre à jour un portfolio → admin ou agent
router.put("/:id", verifyToken, authorizeRoles("admin", "agent"), portfolioController.updatePortfolio);

// Supprimer un portfolio → admin uniquement
router.delete("/:id", verifyToken, authorizeRoles("admin"), portfolioController.deletePortfolio);

module.exports = router;
