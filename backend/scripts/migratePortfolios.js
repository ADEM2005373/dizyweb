const mongoose = require("mongoose");
const Client = require("../models/Client");
const Portfolio = require("../models/Portfolio");
require("dotenv").config();

async function migratePortfolios() {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connecté à MongoDB");

    // Récupérer tous les portfolios sans agent
    const portfolios = await Portfolio.find({ agent: { $exists: false } }).populate('client');
    console.log(`Trouvé ${portfolios.length} portfolios à migrer`);

    for (const portfolio of portfolios) {
      if (portfolio.client && portfolio.client.agentPrincipal) {
        // Mettre à jour le portfolio avec l'agent du client
        await Portfolio.findByIdAndUpdate(portfolio._id, {
          agent: portfolio.client.agentPrincipal
        });
        console.log(`Portfolio ${portfolio._id} mis à jour avec agent ${portfolio.client.agentPrincipal}`);
      } else {
        console.log(`Portfolio ${portfolio._id} n'a pas de client avec agentPrincipal`);
      }
    }

    console.log("Migration des portfolios terminée");
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Déconnexion de MongoDB");
  }
}

// Exécuter la migration
migratePortfolios();