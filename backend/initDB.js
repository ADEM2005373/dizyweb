require("dotenv").config();
const mongoose = require("mongoose");
const Client = require("./models/Client");

const initDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Client.create({
      utilisateur:"695ff33adea6db1fdcc789cb",
      entreprise:"dizy",
      secteur:"marketing"
    });

    console.log("Base de données initialisée avec succès");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

initDB();
