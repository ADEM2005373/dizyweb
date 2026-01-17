const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import du modèle User
const User = require("../models/User");
const Client = require("../models/Client");
const Portfolio = require("../models/Portfolio");
const Admin = require("../models/Admin");

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connecté");

    // Données admin initial
    const adminEmail = process.env.ADMIN_EMAIL || "admin@dizy.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

    // Vérifier si admin existe déjà
    const existingUser = await User.findOne({
      email: adminEmail
    });

    if (existingUser) {
      console.log(`ℹ️ Utilisateur existant trouvé avec role: ${existingUser.role} - suppression...`);
      await User.deleteOne({ email: adminEmail });
    }

    // Hash mot de passe
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Création admin
    const admin = new Admin({
      nom: "SUPER",
      prenom: "ADMIN",
      email: adminEmail,
      motDePasse: hashedPassword,
      isApproved: true
    });

    await admin.save();

    console.log("✅ Admin initial créé avec succès");
    console.log("📧 Email :", adminEmail);
    console.log("🔑 Mot de passe :", adminPassword);

    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Erreur :", err.message);
    process.exit(1);
  });
