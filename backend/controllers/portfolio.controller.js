const Portfolio = require("../models/Portfolio");
const User = require("../models/User");

// =======================
// CRÉER un portfolio
// =======================
exports.createPortfolio = async (req, res) => {
  try {
    const { client } = req.body;
    const userRole = req.user.role;

    // For agents: ensure they can only create portfolios for their clients
    if (userRole === 'agent') {
      const clientDoc = await User.findById(client);
      if (!clientDoc || clientDoc.role !== 'Client' || clientDoc.agentPrincipal?.toString() !== req.user.id) {
        return res.status(403).json({ message: "Vous ne pouvez créer des portfolios que pour vos clients" });
      }
    }

    const portfolio = await Portfolio.create({
      client,
      agent: userRole === 'agent' ? req.user.id : req.body.agent
    });
    res.status(201).json({ message: "Portfolio créé", portfolio });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// RÉCUPÉRER tous les portfolios
// =======================
exports.getAllPortfolios = async (req, res) => {
  try {
    const filter = {};
    if (req.query.client) filter.client = req.query.client;

    // For agents: only show portfolios of their clients
    if (req.user.role === 'agent') {
      // Get clients assigned to this agent
      const agentClients = await User.find({ role: 'Client', agentPrincipal: req.user.id }).select('_id');
      const clientIds = agentClients.map(c => c._id);
      filter.client = { $in: clientIds };
    }

    const portfolios = await Portfolio.find(filter)
      .populate("client", "nom prenom entreprise secteur")
      .populate("agent", "nom prenom specialite");
    res.status(200).json(portfolios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// RÉCUPÉRER un portfolio par ID
// =======================
exports.getPortfolioById = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id)
      .populate("client", "nom prenom entreprise secteur")
      .populate("agent", "nom prenom specialite");

    if (!portfolio) return res.status(404).json({ message: "Portfolio non trouvé" });

    // For agents: check if this portfolio belongs to one of their clients
    if (req.user.role === 'agent') {
      if (portfolio.agent?.toString() !== req.user.id) {
        return res.status(403).json({ message: "Accès non autorisé à ce portfolio" });
      }
    }

    res.status(200).json(portfolio);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// METTRE À JOUR un portfolio
// =======================
exports.updatePortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) return res.status(404).json({ message: "Portfolio non trouvé" });

    // Access control:
    // Agents can update if they are the agent assigned to this portfolio (which implies assigned to the client)
    if (req.user.role === 'agent') {
      if (portfolio.agent?.toString() !== req.user.id) {
        return res.status(403).json({ message: "Accès non autorisé à ce portfolio" });
      }
    }

    portfolio = await Portfolio.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: "Portfolio mis à jour", portfolio });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// SUPPRIMER un portfolio
// =======================
exports.deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) return res.status(404).json({ message: "Portfolio non trouvé" });

    // Access control
    if (req.user.role === 'agent') {
      if (portfolio.agent?.toString() !== req.user.id) {
        return res.status(403).json({ message: "Accès non autorisé à ce portfolio" });
      }
    }

    await portfolio.deleteOne();
    res.status(200).json({ message: "Portfolio supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
