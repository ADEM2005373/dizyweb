const mongoose = require("mongoose");
const documentcommerciauxSchema = new mongoose.Schema(
    {
        typeDocument: {
            type: String,
            enum: ["DEVIS", "FACTURE"],
            default: "FACTURE"
        },
        statut: {
            type: String,
            enum: ["EN_ATTENTE", "APPROUVE", "REFUSE"],
            default: "EN_ATTENTE"
        },
        dateCreation: {
            type: Date,
            default: Date.now
        },
        dateValidation: {
            type: Date
        },
        montantHT: {
            type: Number
        },
        tva: {
            type: Number
        },
        montantTTC: {
            type: Number,
            required: true
        },
        pdfPath: {
            type: String
        },
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true
        },
        agentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agent"
        },
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Pack"
        },
        templateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TemplateDocument"
        },
        reference: {
            type: String,
            unique: true
        },
        statutPaiement: {
            type: String,
            enum: ["SANS_OBJET", "NON_PAYE", "EN_ATTENTE", "PAYE"],
            default: "NON_PAYE"
        },
        datePaiement: {
            type: Date
        },
        commentaire: {
            type: String
        }
    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model("documentCommerciaux", documentcommerciauxSchema);