const mongoose = require("mongoose");
const User = require("./models/User");
const Client = require("./models/Client");
require("dotenv").config();

async function patchData() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dizy_db");
        console.log("Connected to DB...");

        // Find all clients
        const clients = await User.find({ role: 'Client' });
        console.log(`Found ${clients.length} clients.`);

        for (const c of clients) {
            let changed = false;
            if (!c.matriculeFiscale) {
                // Use updateOne to bypass mongoose 'required' check of the *loaded* model if using save() 
                // but actually, we want to SET it so save() works later.
                // We'll use updateOne on the collection to be sure.
                console.log(`Patching Matricule for ${c.email}`);
                await User.updateOne({ _id: c._id }, { $set: { matriculeFiscale: "N/A_" + c._id.toString().slice(-4) } });
                // Unique check might fail if all are "N/A", so appending ID suffix
            }
            // Check other required fields from Client.js
            // entreprise, secteur are required.
            if (!c.entreprise) {
                console.log(`Patching Entreprise for ${c.email}`);
                await User.updateOne({ _id: c._id }, { $set: { entreprise: "Entreprise Inconnue" } });
            }
            if (!c.secteur) {
                console.log(`Patching Secteur for ${c.email}`);
                await User.updateOne({ _id: c._id }, { $set: { secteur: "Autre" } });
            }
        }
        console.log("Patching complete.");
        process.exit();

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

patchData();
