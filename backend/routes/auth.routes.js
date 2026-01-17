const express = require("express");
const router = express.Router();

// Importation du contrôleur d'authentification
const authController = require("../controllers/auth.controller");

// Route d'inscription
router.post("/register", authController.register);

// Route de connexion
router.post("/login", authController.login);

// Setup Admin (Dev Only)
router.post("/seed-admin", authController.seedAdmin);

module.exports = router;
