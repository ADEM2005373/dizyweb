const TemplateDocument = require("../models/TemplateDocument");

// =======================
// CREATE TEMPLATE
// =======================


exports.createTemplate = async (req, res) => {
  try {
    // Safe extraction
    const { nomTemplate, description, actif, typeTemplate } = req.body;

    if (!nomTemplate || !description) {
      return res.status(400).json({ message: "nomTemplate, description,  sont requis" });
    }

    const data = {
      nomTemplate,
      description,
      typeTemplate: typeTemplate || 'PDF',
      actif: actif !== undefined ? actif : true,
      dateCreation: new Date(),
      dateDerniereModification: new Date()
    };

    // Add PDF path if file uploaded
    if (req.file) {
      data.pdfTemplatePath = `/uploads/templates/${req.file.filename}`;
    }

    // Optional HTML/CSS (legacy)
    if (req.body.contenueHTML) data.contenueHTML = req.body.contenueHTML;
    if (req.body.styleCSS) data.styleCSS = req.body.styleCSS;

    const template = await TemplateDocument.create(data);
    res.status(201).json({ message: "Template créé", template });
  } catch (error) {
    console.error("CREATE TEMPLATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// UPDATE TEMPLATE
// =======================
exports.updateTemplate = async (req, res) => {
  try {
    const { nomTemplate, description, actif, typeTemplate } = req.body;

    const data = {
      dateDerniereModification: new Date()
    };

    if (nomTemplate) data.nomTemplate = nomTemplate;
    if (description) data.description = description;
    if (typeTemplate) data.typeTemplate = typeTemplate;
    if (actif !== undefined) data.actif = actif;

    if (req.file) {
      data.pdfTemplatePath = `/uploads/templates/${req.file.filename}`;
    }

    if (req.body.contenueHTML) data.contenueHTML = req.body.contenueHTML;
    if (req.body.styleCSS) data.styleCSS = req.body.styleCSS;

    const template = await TemplateDocument.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!template) return res.status(404).json({ message: "Template non trouvé" });

    res.status(200).json({ message: "Template mis à jour", template });
  } catch (error) {
    console.error("UPDATE TEMPLATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// GET ALL TEMPLATES
// =======================
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await TemplateDocument.find()
    res.status(200).json(templates);
  } catch (error) {
    console.error("GET ALL TEMPLATES ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// GET TEMPLATE BY ID
// =======================
exports.getTemplateById = async (req, res) => {
  try {
    const template = await TemplateDocument.findById(req.params.id).populate("nom prenom email");
    if (!template) return res.status(404).json({ message: "Template non trouvé" });
    res.status(200).json(template);
  } catch (error) {
    console.error("GET TEMPLATE BY ID ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// DELETE TEMPLATE
// =======================
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await TemplateDocument.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: "Template non trouvé" });
    res.status(200).json({ message: "Template supprimé" });
  } catch (error) {
    console.error("DELETE TEMPLATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
