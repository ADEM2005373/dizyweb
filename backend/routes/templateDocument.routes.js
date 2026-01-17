

const express = require("express");
const router = express.Router();
const templateController = require("../controllers/templateDocument.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middlewares");

const multer = require("multer");
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/templates/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Créer un template → admin uniquement
router.post("/", verifyToken, authorizeRoles("admin"), upload.single("pdfTemplate"), templateController.createTemplate);

// Récupérer tous les templates → admin ou agent
router.get("/", verifyToken, authorizeRoles("admin", "agent"), templateController.getAllTemplates);

// Récupérer un template par ID
router.get("/:id", verifyToken, authorizeRoles("admin", "agent"), templateController.getTemplateById);

// Mettre à jour un template → admin uniquement
router.put("/:id", verifyToken, authorizeRoles("admin"), upload.single("pdfTemplate"), templateController.updateTemplate);

// Supprimer un template → admin uniquement
router.delete("/:id", verifyToken, authorizeRoles("admin"), templateController.deleteTemplate);

module.exports = router;
