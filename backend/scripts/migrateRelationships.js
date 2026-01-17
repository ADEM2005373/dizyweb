const mongoose = require("mongoose");
const Client = require("../models/Client");
const RendezVous = require("../models/RendezVous");
const DocumentCommerciaux = require("../models/DocumentCommerciaux");
require("dotenv").config();

async function migrateRelationships() {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connecté à MongoDB");

    // Migrer les RDV sans agent
    const rdvs = await RendezVous.find({ agent: { $exists: false } }).populate('client');
    console.log(`Trouvé ${rdvs.length} RDV à migrer`);

    for (const rdv of rdvs) {
      if (rdv.client && rdv.client.agentPrincipal) {
        await RendezVous.findByIdAndUpdate(rdv._id, {
          agent: rdv.client.agentPrincipal
        });
        console.log(`RDV ${rdv._id} mis à jour avec agent ${rdv.client.agentPrincipal}`);
      } else {
        console.log(`RDV ${rdv._id} n'a pas de client avec agentPrincipal`);
      }
    }

    // Migrer les documents commerciaux sans agentId
    const documents = await DocumentCommerciaux.find({ agentId: { $exists: false } }).populate('clientId');
    console.log(`Trouvé ${documents.length} documents commerciaux à migrer`);

    for (const doc of documents) {
      if (doc.clientId && doc.clientId.agentPrincipal) {
        await DocumentCommerciaux.findByIdAndUpdate(doc._id, {
          agentId: doc.clientId.agentPrincipal
        });
        console.log(`Document ${doc._id} mis à jour avec agentId ${doc.clientId.agentPrincipal}`);
      } else {
        console.log(`Document ${doc._id} n'a pas de client avec agentPrincipal`);
      }
    }

    console.log("Migration des relations terminée");
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Déconnexion de MongoDB");
  }
}

// Exécuter la migration
migrateRelationships();