const mongoose = require("mongoose");
const Agent = require("./models/Agent");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dizy_db");
    console.log("Connected...");

    const email = "testagent@dizy.com";
    const agent = await User.findOne({ email });

    if (!agent) {
        console.log("Agent not found!");
    } else {
        console.log("Agent found:", agent.email);
        console.log("Role:", agent.role);
        console.log("Stored Hash:", agent.motDePasse);

        const pass = "password123";
        const isMatch = await bcrypt.compare(pass, agent.motDePasse);
        console.log(`Checking '${pass}' against hash... Match?`, isMatch);

        // Try 'agent123' just in case
        const isMatch2 = await bcrypt.compare("agent123", agent.motDePasse);
        console.log(`Checking 'agent123' against hash... Match?`, isMatch2);
    }
    process.exit();
}

check();
