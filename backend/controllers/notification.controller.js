const Notification = require("../models/Notification");

// =======================
// CRÉER UNE NOTIFICATION
// =======================
exports.createNotification = async (req, res) => {
  try {
    const { utilisateur, message, lu, date } = req.body;
    const notification = await Notification.create({ utilisateur, message, lu, date });
    res.status(201).json({ message: "Notification créée", notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// RÉCUPÉRER TOUTES LES NOTIFICATIONS
// =======================
exports.getAllNotifications = async (req, res) => {
  try {
    const { utilisateur } = req.query;
    let query = {};
    if (utilisateur) query.utilisateur = utilisateur;

    const notifications = await Notification.find(query).populate("utilisateur", "nom prenom email");
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// RÉCUPÉRER UNE NOTIFICATION PAR ID
// =======================
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id).populate("utilisateur", "nom prenom email");
    if (!notification) return res.status(404).json({ message: "Notification non trouvée" });
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// METTRE À JOUR UNE NOTIFICATION
// =======================
exports.updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!notification) return res.status(404).json({ message: "Notification non trouvée" });
    res.status(200).json({ message: "Notification mise à jour", notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// SUPPRIMER UNE NOTIFICATION
// =======================
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification non trouvée" });
    res.status(200).json({ message: "Notification supprimée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
