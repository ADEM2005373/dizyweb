const mongoose = require("mongoose");
const packSchema = new mongoose.Schema(
    {
        titre: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        prix: {
            type: Number,
            required: true
        },
        prixHT: {
            type: Number,
            default: 0
        },
        tva: {
            type: Number,
            default: 20
        },
        actif: {
            type: Boolean,
            required: true
        },
        image: {
            type: String, // URL or placeholder identifier
            default: ""
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        // Custom Pack Fields
        isCustom: { type: Boolean, default: false },
        private: { type: Boolean, default: false }, // If true, only visible to clientId
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // The client who requested it (or for whom it is made)

        status: {
            type: String,
            enum: ['ACTIVE', 'PENDING_AGENT', 'PENDING_ADMIN', 'APPROVED', 'REJECTED'],
            default: 'ACTIVE' // Standard packs are ACTIVE by default
        },

        clientRequest: { type: String }, // Original suggestion text

        agentProposal: {
            prixPropose: Number,
            description: String,
            details: String
        }

    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model("Pack", packSchema);