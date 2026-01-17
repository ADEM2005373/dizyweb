const mongoose = require('mongoose');
const Pack = require('../models/Pack');
require('dotenv').config();

const defaults = [
    { titre: "Starter", description: "Idéal pour débuter votre présence en ligne.", type: "Standard", prix: 499, actif: true },
    { titre: "Business", description: "Pour les entreprises en croissance.", type: "Premium", prix: 999, actif: true },
    { titre: "Premium", description: "Solution complète et sur-mesure.", type: "Premium", prix: 1999, actif: true }
];

const seedPacks = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dizyweb');
        console.log("Connected to MongoDB for seeding...");

        const count = await Pack.countDocuments();
        if (count === 0) {
            await Pack.insertMany(defaults);
            console.log("✅ 3 Default Packs seeded successfully!");
        } else {
            console.log("ℹ️ Packs already exist. Skipping seed.");
        }
        process.exit();
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
};

seedPacks();
