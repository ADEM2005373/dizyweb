const mongoose = require("mongoose");
const User = require("./User");

const adminSchema = new mongoose.Schema({
    // Admin specific fields can go here
    permissions: {
        type: [String],
        default: ["all"]
    }
});

module.exports = User.discriminator("Admin", adminSchema);