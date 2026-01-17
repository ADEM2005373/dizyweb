const ElementPortfolio = require("../models/ElementPortfolio");

// =======================
// CRÉER un élément portfolio
// =======================
exports.createElementPortfolio = async (req, res) => {
  try {
    const { portfolio, type, description, date, serviceAssocie } = req.body;
    let { url } = req.body;

    // If a file was uploaded, construct the URL
    if (req.file) {
      url = `http://localhost:5000/uploads/portfolio/${req.file.filename}`;
    }

    const element = await ElementPortfolio.create({
      portfolio,
      type,
      description,
      date,
      serviceAssocie,
      url
    });
    res.status(201).json({ message: "Élément portfolio créé", element });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// RÉCUPÉRER tous les éléments
// =======================
exports.getAllElementsPortfolio = async (req, res) => {
  try {
    const filter = {};
    if (req.query.portfolio) filter.portfolio = req.query.portfolio;

    const elements = await ElementPortfolio.find(filter)
      .populate("portfolio") // Portfolio doesn't have many fields, just return all
      .populate("serviceAssocie", "titre description"); // Pack uses 'titre'
    res.status(200).json(elements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// RÉCUPÉRER un élément par ID
// =======================
exports.getElementPortfolioById = async (req, res) => {
  try {
    const element = await ElementPortfolio.findById(req.params.id)
      .populate("portfolio")
      .populate("serviceAssocie", "titre description");
    if (!element) return res.status(404).json({ message: "Élément non trouvé" });
    res.status(200).json(element);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// METTRE À JOUR un élément
// =======================
exports.updateElementPortfolio = async (req, res) => {
  try {
    const element = await ElementPortfolio.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!element) return res.status(404).json({ message: "Élément non trouvé" });
    res.status(200).json({ message: "Élément mis à jour", element });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// SUPPRIMER un élément
// =======================
exports.deleteElementPortfolio = async (req, res) => {
  try {
    const element = await ElementPortfolio.findByIdAndDelete(req.params.id);
    if (!element) return res.status(404).json({ message: "Élément non trouvé" });
    res.status(200).json({ message: "Élément supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
