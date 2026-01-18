const mongoose = require('mongoose');

const DocumentCommerciauxSchema = new mongoose.Schema({
    reference: { type: String, required: true, unique: true }, // e.g., FCT-2026/0001
    typeDocument: { type: String, enum: ['DEVIS', 'FACTURE'], required: true },

    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Can be Agent or Admin

    date: { type: Date, default: Date.now },
    valideJusquAu: { type: Date }, // For DEVIS

    items: [{
        reference: String,
        description: String,
        quantite: { type: Number, default: 1 },
        prixUnitaire: Number,
        totalHT: Number
    }],

    montantHT: { type: Number, required: true },
    tva: { type: Number, default: 0 }, // Percentage
    montantTTC: { type: Number, required: true },

    statut: {
        type: String,
        enum: ['EN_ATTENTE', 'EN_ATTENTE_AGENT', 'EN_ATTENTE_ADMIN', 'APPROUVE', 'REFUSE', 'PAYE', 'ANNULE', 'TERMINE'],
        default: 'EN_ATTENTE'
    },

    // Custom Request Flow
    isCustomRequest: { type: Boolean, default: false },
    clientSuggestion: { type: String }, // What the client asks for
    agentProposal: {
        prixPropose: Number,
        description: String,
        details: String // Special Livrable details
    },
    adminApprovalStatus: {
        type: String,
        enum: ['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'],
        default: 'NOT_REQUIRED'
    },

    pdfPath: { type: String }, // Path to generated PDF

    // Specific fields for the Layout
    clientDetailsSnapshot: {
        nom: String,
        entreprise: String,
        adresse: String,
        matricule: String,
        rib: String, // "Client is the one who write his rib" -> Stored here at generation time
        email: String,
        telephone: String
    }
}, { timestamps: true });

module.exports = mongoose.model('DocumentCommerciaux', DocumentCommerciauxSchema);