const mongoose = require("mongoose");
require("dotenv").config();

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const adminEmail = process.env.ADMIN_EMAIL || "admin@dizzy.com";
        const user = await mongoose.connection.db.collection('users').findOne({ email: adminEmail });
        console.log("Admin User found:");
        console.log(user);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkAdmin();
