// backend/controllers/rendezvous.controller.js
const RendezVous = require("../models/RendezVous");

// =======================
// CREATE Rendez-vous
// =======================
exports.createRendezVous = async (req, res) => {
  try {
    const { client, agent, type, dateProposee } = req.body;

    if (!client || !type || !dateProposee) {
      return res.status(400).json({ message: "Client, type et dateProposee sont requis" });
    }

    let assignedAgent = agent;

    // If agent is not provided, try to find the client's assigned agent
    if (!assignedAgent) {
      const Client = require("../models/Client");
      const clientData = await Client.findById(client);
      if (clientData && clientData.agentPrincipal) {
        assignedAgent = clientData.agentPrincipal;
      } else {
        // Fallback: If no agent assigned, we could assign a default admin or error.
        // For now, let's error if strictly required, or allow null if model permits (it doesn't).
        return res.status(400).json({ message: "Aucun agent assigné à ce client. Contactez l'administrateur." });
      }
    }

    const rendezVous = await RendezVous.create({
      client,
      agent: assignedAgent,
      type,
      dateProposee
    });

    res.status(201).json({ message: "Rendez-vous créé", rendezVous });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// GET all Rendez-vous
// =======================
exports.getAllRendezVous = async (req, res) => {
  try {
    let filter = {};

    // For agents: only show RDVs where they are the agent
    if (req.user.role === 'agent') {
      filter.agent = req.user.id;
    }

    // For clients: only show their own RDVs
    if (req.user.role === 'client') {
      filter.client = req.user.id;
    }

    const rendezVous = await RendezVous.find(filter)
      .populate("client", "entreprise secteur nom prenom")
      .populate("agent", "specialite nom prenom")
      .sort({ dateProposee: 1 });
    res.status(200).json(rendezVous);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// GET Rendez-vous by ID
// =======================
exports.getRendezVousById = async (req, res) => {
  try {
    const rendezVous = await RendezVous.findById(req.params.id)
      .populate("client", "entreprise secteur nom prenom")
      .populate("agent", "specialite nom prenom");

    if (!rendezVous) return res.status(404).json({ message: "Rendez-vous non trouvé" });

    // Access control: agents can only see RDVs where they are the agent, clients can only see their own RDVs
    if (req.user.role === 'agent' && rendezVous.agent?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès non autorisé à ce rendez-vous" });
    }
    if (req.user.role === 'client' && rendezVous.client?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès non autorisé à ce rendez-vous" });
    }

    res.status(200).json(rendezVous);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// UPDATE Rendez-vous
// =======================
exports.updateRendezVous = async (req, res) => {
  try {
    const rendezVous = await RendezVous.findById(req.params.id);
    if (!rendezVous) return res.status(404).json({ message: "Rendez-vous non trouvé" });

    // Access Control
    if (req.user.role === 'agent' && rendezVous.agent?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }
    if (req.user.role === 'client' && rendezVous.client?.toString() !== req.user.id) {
      // Clients might be able to cancel, but for now restrict full update
      // Or check specific fields. Assuming strict ownership for now.
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const { type, dateProposee, dateConfirmee, statut } = req.body;

    if (type !== undefined) rendezVous.type = type;
    if (dateProposee !== undefined) rendezVous.dateProposee = dateProposee;
    if (dateConfirmee !== undefined) rendezVous.dateConfirmee = dateConfirmee;
    if (statut !== undefined) rendezVous.statut = statut;

    await rendezVous.save();

    res.status(200).json({ message: "Rendez-vous mis à jour", rendezVous });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =======================
// DELETE Rendez-vous
// =======================
exports.deleteRendezVous = async (req, res) => {
  try {
    const rendezVous = await RendezVous.findById(req.params.id);
    if (!rendezVous) return res.status(404).json({ message: "Rendez-vous non trouvé" });

    // Access Control
    if (req.user.role === 'agent' && rendezVous.agent?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    await rendezVous.deleteOne();
    res.status(200).json({ message: "Rendez-vous supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
