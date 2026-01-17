const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const TemplateDocument = require("./models/TemplateDocument");
const fs = require('fs');
const path = require('path');
require("dotenv").config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dizy_db");
        console.log("Connected to MongoDB...");

        // 1. Ensure Admin exists
        let admin = await User.findOne({ email: "admin@dizy.com" });
        if (!admin) {
            console.log("Creating default Admin...");
            const hashedPassword = await bcrypt.hash("admin123", 10);
            admin = await User.create({
                nom: "Système",
                prenom: "Admin",
                email: "admin@dizy.com",
                motDePasse: hashedPassword,
                role: "Admin",
                isApproved: true
            });
        }

        // Ensure the record is an Admin in the DB (direct update to bypass discriminators if any)
        await mongoose.connection.db.collection('users').updateOne(
            { email: "admin@dizy.com" },
            { $set: { role: "Admin", isApproved: true } }
        );

        console.log(`Admin ready: ${admin.email}`);

        // 2. Prepare Logo
        const logoPath = path.join(__dirname, 'uploads', 'logo.jpg');
        let logoBase64 = '';
        if (fs.existsSync(logoPath)) {
            const logoData = fs.readFileSync(logoPath);
            logoBase64 = `data:image/jpeg;base64,${logoData.toString('base64')}`;
        }

        // 3. Clear and Seed Templates
        console.log("Seeding/Updating templates with logo...");
        await TemplateDocument.deleteMany({});

        const templates = [
            {
                nomTemplate: "Standard Dizy",
                description: "Template moderne avec logo officiel pour factures et devis.",
                creeParAdminId: admin._id,
                actif: true,
                contenueHTML: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #d91414; padding-bottom: 10px; align-items: center;">
                            ${logoBase64 ? `<img src="${logoBase64}" style="height: 60px; border-radius: 8px;">` : '<h1 style="color: #d91414; margin: 0;">DIZY.</h1>'}
                            <div style="text-align: right;">
                                <h2 style="margin: 0; color: #d91414;">{{document_type}}</h2>
                                <p style="margin: 5px 0;">Réf: {{reference}}</p>
                                <p style="margin: 5px 0;">Date: {{date}}</p>
                            </div>
                        </div>
                        <div style="margin: 30px 0; display: flex; justify-content: space-between;">
                            <div>
                                <strong>Émetteur:</strong><br>DizyWeb Services<br>Agent: {{agent_prenom}} {{agent_nom}}
                            </div>
                            <div style="text-align: right;">
                                <strong>Destinataire:</strong><br>{{client_entreprise}}<br>{{client_prenom}} {{client_nom}}
                            </div>
                        </div>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            <thead style="background: #fdf2f2;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #f2a950; color: #d91414;">Description</th>
                                    <th style="padding: 10px; text-align: right; border: 1px solid #f2a950; color: #d91414;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #eee;">Prestations de services digitaux ({{document_type}})</td>
                                    <td style="padding: 10px; border: 1px solid #eee; text-align: right;">{{montant_ht}} €</td>
                                </tr>
                            </tbody>
                        </table>
                        <div style="margin-top: 20px; text-align: right;">
                            <p>Montant HT: {{montant_ht}} €</p>
                            <p>TVA ({{tva}}%): {{montant_tva}} €</p>
                            <h3 style="color: #d91414;">TOTAL TTC: {{montant_ttc}} €</h3>
                        </div>
                        <div style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #777; font-style: italic;">
                            {{commentaire}}
                        </div>
                    </div>
                `,
                styleCSS: "body { background: white; }",
                dateCreation: new Date(),
                dateDerniereModification: new Date()
            },
            {
                nomTemplate: "Premium Dizy Elite",
                description: "Template luxueux avec logo officiel et accents dorés.",
                creeParAdminId: admin._id,
                actif: true,
                contenueHTML: `
                    <div style="font-family: 'Playfair Display', serif; padding: 40px; background: #ffffff; color: #300000; min-height: 800px;">
                        <div style="border: 1px solid #d91414; padding: 30px; position: relative;">
                            <div style="text-align: center; margin-bottom: 40px;">
                                ${logoBase64 ? `<img src="${logoBase64}" style="height: 100px; border-radius: 12px; margin-bottom: 10px;">` : '<h1 style="color: #d91414; letter-spacing: 5px; margin: 0;">DIZY ELITE</h1>'}
                                <p style="text-transform: uppercase; font-size: 12px; margin-top: 10px; color: #f2a950;">Luxury Digital Solutions</p>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 50px;">
                                <div style="font-size: 14px;">
                                    <h3 style="color: #d91414; margin-bottom: 10px;">DÉTAILS</h3>
                                    <p style="margin: 2px 0;">DOC: {{document_type}}</p>
                                    <p style="margin: 2px 0;">REF: {{reference}}</p>
                                    <p style="margin: 2px 0;">DATE: {{date}}</p>
                                </div>
                                <div style="text-align: right; font-size: 14px;">
                                    <h3 style="color: #d91414; margin-bottom: 10px;">CLIENT</h3>
                                    <p style="margin: 2px 0; font-weight: bold;">{{client_entreprise}}</p>
                                    <p style="margin: 2px 0;">{{client_prenom}} {{client_nom}}</p>
                                </div>
                            </div>
                            <table style="width: 100%; border-collapse: collapse; margin: 40px 0;">
                                <thead>
                                    <tr style="border-bottom: 1px solid #f2a950;">
                                        <th style="text-align: left; padding: 15px 0; color: #d91414;">DESCRIPTION DES SERVICES</th>
                                        <th style="text-align: right; padding: 15px 0; color: #d91414;">MONTANT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="padding: 25px 0; font-style: italic;">Services de Design & Développement Premium ({{document_type}})</td>
                                        <td style="padding: 25px 0; text-align: right; font-weight: bold;">{{montant_ht}} €</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; display: flex; justify-content: flex-end;">
                                <div style="width: 250px; text-align: right;">
                                    <p style="margin: 5px 0; font-size: 14px;">Sous-total HT: {{montant_ht}} €</p>
                                    <p style="margin: 5px 0; font-size: 14px;">Taxe ({{tva}}%): {{montant_tva}} €</p>
                                    <div style="background: #d91414; color: #fff; padding: 10px; margin-top: 15px; border-radius: 4px;">
                                        <h2 style="margin: 0; font-size: 20px;">TOTAL: {{montant_ttc}} €</h2>
                                    </div>
                                </div>
                            </div>
                            <div style="margin-top: 60px; font-size: 11px; text-align: center; color: #d91414; border-top: 1px solid #eee; padding-top: 20px;">
                                <p>{{commentaire}}</p>
                                <p style="margin-top: 10px; font-weight: bold;">DIZY.COM — L'EXCELLENCE DIGITALE SUR MESURE</p>
                            </div>
                        </div>
                    </div>
                `,
                styleCSS: "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');",
                dateCreation: new Date(),
                dateDerniereModification: new Date()
            }
        ];

        await TemplateDocument.insertMany(templates);
        console.log("Templates seeded successfully!");

        console.log("Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seed();
