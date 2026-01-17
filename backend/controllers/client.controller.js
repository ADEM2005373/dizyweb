// backend/controllers/client.controller.js
const User = require("../models/User");
const Client = require("../models/Client");

// =======================
// CREATE Client
// =======================
exports.createClient = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, entreprise, secteur, matriculeFiscale, agentPrincipal } = req.body;

    if (!nom || !prenom || !email || !motDePasse || !entreprise || !secteur || !matriculeFiscale) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const client = await Client.create({
      nom,
      prenom,
      email,
      motDePasse: hashedPassword,
      entreprise,
      secteur,
      matriculeFiscale,
      agentPrincipal: agentPrincipal || null,
      isApproved: true // Auto approve when created by admin/agent
    });

    // Notify the assigned agent if any
    if (agentPrincipal) {
      try {
        const Notification = require("../models/Notification");
        await Notification.create({
          utilisateur: agentPrincipal,
          message: `Un nouveau client vous a été assigné: ${entreprise} (${prenom} ${nom}).`,
          lu: false,
          date: new Date()
        });
      } catch (notifError) {
        console.error('Error creating assignment notification:', notifError);
      }
    }

    res.status(201).json({
      message: "Client créé avec succès",
      client
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// GET all Clients
// =======================
exports.getAllClients = async (req, res) => {
  try {
    let query = { role: 'Client' };
    if (req.user.role === 'agent') {
      query.agentPrincipal = req.user.id;
    }
    const clients = await User.find(query)
      .populate("agentPrincipal", "nom prenom email specialite");
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// GET Client by ID
// =======================
exports.getClientById = async (req, res) => {
  try {
    const client = await User.findById(req.params.id)
      .populate("agentPrincipal", "nom prenom email specialite");

    if (!client || client.role !== 'Client') return res.status(404).json({ message: "Client non trouvé" });

    // Agents can only access their assigned clients
    if (req.user.role === 'agent' && client.agentPrincipal?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès non autorisé à ce client" });
    }

    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// UPDATE Client
// =======================
exports.updateClient = async (req, res) => {
  try {
    const client = await User.findById(req.params.id);

    if (!client || client.role !== 'Client') return res.status(404).json({ message: "Client non trouvé" });

    // Agents can only update their assigned clients
    if (req.user.role === 'agent' && client.agentPrincipal?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Vous ne pouvez modifier que vos clients assignés" });
    }

    const { entreprise, secteur, agentPrincipal } = req.body;

    if (entreprise) client.entreprise = entreprise;
    if (secteur) client.secteur = secteur;
    if (agentPrincipal !== undefined) client.agentPrincipal = agentPrincipal;

    await client.save();

    res.status(200).json({ message: "Client mis à jour avec succès", client });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// UPDATE Client Social Links (Agent Action)
// =======================
exports.updateClientSocialLinks = async (req, res) => {
  try {
    const client = await User.findById(req.params.id);

    if (!client || client.role !== 'Client') return res.status(404).json({ message: "Client non trouvé" });

    // Check if the requesting agent is assigned to this client
    if (req.user.role === 'agent' && client.agentPrincipal?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Vous ne pouvez modifier que les réseaux sociaux de vos clients" });
    }

    const { facebook, instagram, linkedin, twitter, website } = req.body;

    if (!client.socialLinks) client.socialLinks = {};
    if (facebook !== undefined) client.socialLinks.facebook = facebook;
    if (instagram !== undefined) client.socialLinks.instagram = instagram;
    if (linkedin !== undefined) client.socialLinks.linkedin = linkedin;
    if (twitter !== undefined) client.socialLinks.twitter = twitter;
    if (website !== undefined) client.socialLinks.website = website;

    await client.save();

    res.status(200).json({ message: "Liens réseaux sociaux mis à jour avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


