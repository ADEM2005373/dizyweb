const mongoose = require("mongoose");
require("dotenv").config();

async function fixAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = require("./models/User");
        // Try both dizy and dizzy just in case
        const emails = ["admin@dizy.com", "admin@dizzy.com"];
        const res = await mongoose.connection.db.collection('users').updateMany(
            { email: { $in: emails } },
            { $set: { isApproved: true, role: "Admin" } }
        );
        console.log(`Updated ${res.modifiedCount} admin accounts.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
fixAdmin();
