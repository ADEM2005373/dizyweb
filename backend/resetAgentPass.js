const mongoose = require("mongoose");
const User = require("./models/User");
// const Agent = require("./models/Agent"); // User model is enough
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function resetPass() {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dizy_db");
    console.log("Connected...");

    const email = "testagent@dizy.com";
    const user = await User.findOne({ email });

    if (!user) {
        console.log("Agent not found!");
    } else {
        console.log("Resetting password for:", user.email);
        const newPass = "password123";
        const hashedPassword = await bcrypt.hash(newPass, 10);

        user.motDePasse = hashedPassword;
        await user.save();

        console.log("Password reset to 'password123'. Hash updated.");

        // Verify immediately
        const isMatch = await bcrypt.compare(newPass, user.motDePasse);
        console.log("Immediate verification match?", isMatch);
    }
    process.exit();
}

resetPass();
