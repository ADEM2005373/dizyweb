const mongoose = require("mongoose");

const rendezvousSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true
    },
    type: {
      type: String,
      required: true
    },
    dateProposee: {
      type: Date,
      required: true
    },
    dateConfirmee: {
      type: Date // pas obligatoire au départ
    },
    statut: {
      type: String,
      enum: ["en attente", "confirmé", "annulé", "terminé"],
      default: "en attente"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("RendezVous", rendezvousSchema);
