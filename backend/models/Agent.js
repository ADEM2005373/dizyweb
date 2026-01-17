const mongoose = require("mongoose");
const User = require("./User");

const agentSchema = new mongoose.Schema({
    specialite: {
        type: String,
        required: true,
        trim: true
    },
    disponibilites: {
        type: String,
        default: "Lundi - Vendredi, 09h - 17h"
    },
    nbrClient: {
        type: Number,
        default: 0
    },
    actif: {
        type: Boolean,
        default: true
    }
});

module.exports = User.discriminator("Agent", agentSchema);