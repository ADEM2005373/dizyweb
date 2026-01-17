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
        }

    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model("Pack", packSchema);