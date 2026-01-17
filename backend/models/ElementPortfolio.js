const mongoose = require("mongoose");
const elementportfolioSchema = new mongoose.Schema(
    {
        portfolio: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Portfolio",
            required: true
        },
        type: {
            type: String,
            enum: ["image", "lien", "fichier", "video"],
            required: true
        },
        description: {
            type: String,
            required: true
        },
        url: {
            type: String, // Link to file or image
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        serviceAssocie: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Pack",
            required: true
        }
    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model("ElementPortfolio", elementportfolioSchema);