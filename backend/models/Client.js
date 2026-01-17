const mongoose = require("mongoose");
const User = require("./User");

const clientSchema = new mongoose.Schema({
    entreprise: {
        type: String,
        required: true,
        trim: true
    },
    secteur: {
        type: String,
        required: true,
        trim: true
    },
    matriculeFiscale: {
        type: String,
        required: false,
        trim: true,
        unique: true,
        sparse: true
    },
    adresse: { type: String, default: '' },
    codePostal: { type: String, default: '' },
    ville: { type: String, default: '' },
    rib: { type: String, default: '' },
    // agentPrincipal inherited from User schema
    socialLinks: {
        facebook: { type: String, default: '' },
        instagram: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        twitter: { type: String, default: '' },
        website: { type: String, default: '' }
    }
});

module.exports = User.discriminator("Client", clientSchema);