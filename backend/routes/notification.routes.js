const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middlewares");

// CRÉER une notification → accessible aux admin et agents
router.post("/", verifyToken, authorizeRoles("admin", "agent"), notificationController.createNotification);

// RÉCUPÉRER toutes les notifications → admin et agents
router.get("/", verifyToken, authorizeRoles("admin", "agent"), notificationController.getAllNotifications);

// RÉCUPÉRER une notification par ID
router.get("/:id", verifyToken, authorizeRoles("admin", "agent"), notificationController.getNotificationById);

// METTRE À JOUR une notification
router.put("/:id", verifyToken, authorizeRoles("admin", "agent"), notificationController.updateNotification);

// SUPPRIMER une notification → admin uniquement
router.delete("/:id", verifyToken, authorizeRoles("admin"), notificationController.deleteNotification);

module.exports = router;
