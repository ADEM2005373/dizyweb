// backend/controllers/agent.controller.js
const Agent = require("../models/Agent");
const Client = require("../models/Client");
const User = require("../models/User");
const mongoose = require("mongoose");

// =======================
// CREATE Agent
// =======================
const bcrypt = require("bcryptjs"); // Need bcrypt to hash password

// =======================
// CREATE Agent (Admin Action)
// =======================
exports.createAgent = async (req, res) => {
  try {
    // Admin sends: nom, prenom, email, telephone, motDePasse, specialite
    const { nom, prenom, email, telephone, motDePasse, specialite } = req.body;

    if (!nom || !prenom || !email || !motDePasse) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Check if user exists
    const existingUser = await Agent.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Create Agent (User discriminator)
    const newAgent = await Agent.create({
      nom,
      prenom,
      email,
      telephone,
      motDePasse: hashedPassword,
      specialite,
      role: 'Agent', // Important for discriminator
      isApproved: true, // Auto approve admin created agents
      disponibilites: "Lundi-Vendredi 9h-17h", // Default
      nbrClient: 0,
      actif: true
    });

    res.status(201).json({
      message: "Agent créé avec succès",
      agent: newAgent
    });
  } catch (error) {
    console.error("Create Agent Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// GET all Agents
// =======================
exports.getAllAgents = async (req, res) => {
  try {
    const agents = await Agent.find();
    res.status(200).json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// GET Agent by ID
// =======================
exports.getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) return res.status(404).json({ message: "Agent non trouvé" });

    res.status(200).json(agent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// UPDATE Agent
// =======================
exports.updateAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ message: "Agent non trouvé" });

    const { specialite, disponibilites, nbrClient, actif } = req.body;

    if (specialite) agent.specialite = specialite;
    if (disponibilites) agent.disponibilites = disponibilites;
    if (nbrClient !== undefined) agent.nbrClient = nbrClient;
    if (actif !== undefined) agent.actif = actif;

    await agent.save();

    res.status(200).json({ message: "Agent mis à jour avec succès", agent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// GET Clients for Current Agent
// =======================
exports.getMyClients = async (req, res) => {
  try {
    const agentId = req.user.id;

    // Use User.find with role filter to get clients assigned to this agent
    const clients = await User.find({
      role: 'Client',
      agentPrincipal: agentId
    });

    res.status(200).json(clients);
  } catch (error) {
    console.error("Error in getMyClients:", error);
    res.status(500).json({ message: error.message });
  }
};
