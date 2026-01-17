const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");
require("./models/Client");

async function findClient() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dizy_db");
        const client = await User.findOne({ role: "Client" });
        if (client) {
            console.log("CLIENT_FOUND:" + client.email);
        } else {
            console.log("NO_CLIENT_FOUND");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
findClient();
