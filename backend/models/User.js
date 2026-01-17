const mongoose = require("mongoose");

const baseOptions = {
  discriminatorKey: "role",
  collection: "users",
  timestamps: true
};

const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true
    },
    prenom: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    telephone: {
      type: String
    },
    motDePasse: {
      type: String,
      required: true
    },
    imageProfile: {
      type: String,
      default: ""
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    agentPrincipal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Can ref User or Agent
    }
  },
  baseOptions
);

module.exports = mongoose.model("User", userSchema);
