const mongoose = require("mongoose");
require("dotenv").config();

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = require("./models/User");
        const users = await User.find({}, 'email role isApproved');
        console.log("Current Users in DB:");
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkUsers();
