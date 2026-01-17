const mongoose = require("mongoose");
const TemplateDocument = require("./models/TemplateDocument");
const User = require("./models/User");
require("dotenv").config();

async function seedTemplate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dizyweb");
        console.log("Connected to DB");

        const admin = await User.findOne({ role: /Admin/i });
        if (!admin) {
            console.log("No admin found to associate template with");
            return;
        }

        const template = {
            nomTemplate: "Standard Dizy",
            description: "Template moderne bleu et blanc pour factures et devis.",
            contenueHTML: `
                <div class="invoice-box">
                    <table cellpadding="0" cellspacing="0">
                        <tr class="top">
                            <td colspan="2">
                                <table>
                                    <tr>
                                        <td class="title">
                                            <h1 style="color: #6C5DD3;">DIZY.</h1>
                                        </td>
                                        <td>
                                            Type: {{document_type}}<br>
                                            Date: {{date}}<br>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr class="information">
                            <td colspan="2">
                                <table>
                                    <tr>
                                        <td>
                                            <strong>Émetteur:</strong><br>
                                            DizyWeb Services<br>
                                            Agent: {{agent_nom}} {{agent_prenom}}
                                        </td>
                                        <td>
                                            <strong>Destinataire:</strong><br>
                                            {{client_entreprise}}<br>
                                            {{client_prenom}} {{client_nom}}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr class="heading">
                            <td>Description</td>
                            <td>Prix</td>
                        </tr>
                        <tr class="item">
                            <td>{{document_type}} - Prestations Digitales</td>
                            <td>{{montant_ht}} €</td>
                        </tr>
                        <tr class="total">
                            <td></td>
                            <td>
                                HT: {{montant_ht}} €<br>
                                TVA ({{tva}}%): Calculé<br>
                                <strong>TOTAL TTC: {{montant_ttc}} €</strong>
                            </td>
                        </tr>
                    </table>
                    <div style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #777;">
                        {{commentaire}}
                    </div>
                </div>
            `,
            styleCSS: `
                .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; font-size: 16px; line-height: 24px; font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; color: #555; }
                .invoice-box table { width: 100%; line-height: inherit; text-align: left; }
                .invoice-box table td { padding: 5px; vertical-align: top; }
                .invoice-box table tr td:nth-child(2) { text-align: right; }
                .invoice-box table tr.top table td { padding-bottom: 20px; }
                .invoice-box table tr.top table td.title { font-size: 45px; line-height: 45px; color: #333; }
                .invoice-box table tr.information table td { padding-bottom: 40px; }
                .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
                .invoice-box table tr.details td { padding-bottom: 20px; }
                .invoice-box table tr.item td { border-bottom: 1px solid #eee; }
                .invoice-box table tr.item.last td { border-bottom: none; }
                .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
            `,
            actif: true,
            dateCreation: new Date(),
            dateDerniereModification: new Date(),
            creeParAdminId: admin._id
        };

        await TemplateDocument.create(template);
        console.log("Default template created!");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedTemplate();
