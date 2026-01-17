const mongoose = require("mongoose");
const TemplateDocument = require("./models/TemplateDocument");
const User = require("./models/User");
require("dotenv").config();

async function seedPremiumTemplate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dizyweb");
        console.log("Connected to DB");

        const admin = await User.findOne({ role: /Admin/i });
        if (!admin) {
            console.log("No admin found to associate template with");
            return;
        }

        const template = {
            nomTemplate: "Premium Dark Elite",
            description: "Template haut de gamme sombre avec des accents dorés.",
            contenueHTML: `
                <div class="premium-invoice">
                    <div class="header">
                        <div class="logo">DIZY <span class="elite">ELITE</span></div>
                        <div class="doc-meta">
                            <h1>{{document_type}}</h1>
                            <p>REF: #{{date}}-精英</p>
                        </div>
                    </div>
                    
                    <div class="address-box">
                        <div class="from">
                            <label>PRESTATEUR</label>
                            <h3>DizyWeb Global</h3>
                            <p>Agent: {{agent_prenom}} {{agent_nom}}</p>
                        </div>
                        <div class="to">
                            <label>CLIENT</label>
                            <h3>{{client_entreprise}}</h3>
                            <p>{{client_prenom}} {{client_nom}}</p>
                        </div>
                    </div>

                    <div class="items-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>DESIGNATION</th>
                                    <th>MONTANT HT</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{{document_type}} SPECIFIQUE - PACK DIZY</td>
                                    <td>{{montant_ht}} €</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="financials">
                        <div class="signature">
                            <p>Validé par l'agent DizyWeb</p>
                            <div class="sig-line"></div>
                        </div>
                        <div class="totals">
                            <div class="line"><span>Sous-total HT</span> <span>{{montant_ht}} €</span></div>
                            <div class="line"><span>TVA ({{tva}}%)</span> <span>Calculé</span></div>
                            <div class="line grand-total"><span>TOTAL TTC</span> <span>{{montant_ttc}} €</span></div>
                        </div>
                    </div>

                    <div class="footer">
                        <p>{{commentaire}}</p>
                        <div class="legal">DIZYWEB SERVICES - SIRET 123 456 789 00012 - CAPITAL 10 000€</div>
                    </div>
                </div>
            `,
            styleCSS: `
                .premium-invoice { background: #1a1a1a; color: #ffffff; font-family: 'Poppins', sans-serif; padding: 40px; border: 1px solid #d4af37; border-radius: 8px; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d4af37; padding-bottom: 20px; }
                .logo { font-size: 32px; font-weight: 800; letter-spacing: 2px; }
                .elite { color: #d4af37; }
                .doc-meta h1 { margin: 0; font-size: 24px; text-transform: uppercase; color: #d4af37; }
                .address-box { display: flex; justify-content: space-between; margin-top: 40px; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 4px; }
                .address-box label { font-size: 10px; color: #d4af37; font-weight: 700; letter-spacing: 1px; display: block; margin-bottom: 10px; }
                .address-box h3 { margin: 0; }
                .items-table { margin-top: 50px; }
                .items-table table { width: 100%; border-collapse: collapse; }
                .items-table th { text-align: left; padding: 15px; border-bottom: 1px solid #333; color: #d4af37; font-size: 12px; }
                .items-table td { padding: 15px; border-bottom: 1px solid #222; }
                .financials { display: flex; justify-content: space-between; margin-top: 50px; }
                .signature { width: 250px; }
                .sig-line { height: 1px; background: #d4af37; margin-top: 50px; }
                .totals { width: 300px; }
                .totals .line { display: flex; justify-content: space-between; padding: 5px 0; }
                .grand-total { border-top: 2px solid #d4af37; margin-top: 10px; padding-top: 10px !important; font-weight: 800; font-size: 20px; color: #d4af37; }
                .footer { margin-top: 80px; text-align: center; border-top: 1px solid #333; padding-top: 20px; }
                .legal { font-size: 10px; color: #666; margin-top: 20px; }
            `,
            actif: true,
            dateCreation: new Date(),
            dateDerniereModification: new Date(),
            creeParAdminId: admin._id
        };

        await TemplateDocument.create(template);
        console.log("Premium Dark template created!");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedPremiumTemplate();
