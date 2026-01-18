const fs = require('fs');
const path = require('path');
const html_to_pdf = require('html-pdf-node');
const handlebars = require('handlebars');

/**
 * Generate PDF using HTML Layout matching the 'Livrable' example
 */
exports.generatePDF = async (documentData, outputPath) => {
    try {
        // Ensure we work with a plain object
        const sourceData = documentData.toObject ? documentData.toObject() : documentData;

        console.log("PDF GENERATOR INPUT:", JSON.stringify(sourceData, null, 2));

        // 1. Prepare Data
        const data = {
            ...sourceData,
            isFacture: sourceData.typeDocument === 'FACTURE',
            dateFormatted: new Date(sourceData.createdAt || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
            totalTVA: (Number(sourceData.montantHT || 0) * (Number(sourceData.tva || 0) / 100)).toFixed(2),
            items: (sourceData.items || []).map(item => ({
                ...item,
                prixUnitaire: Number(item.prixUnitaire) || 0,
                totalLine: ((Number(item.quantite) || 0) * (Number(item.prixUnitaire) || 0)).toFixed(3)
            })),
            // Safety defaults for totals
            montantHT: Number(sourceData.montantHT || 0),
            montantTTC: Number(sourceData.montantTTC || 0),
            tva: Number(sourceData.tva || 0)
        };

        // 2. Load Logo (Try-Catch safe)
        let logoBase64 = '';
        try {
            const logoPath = path.join(__dirname, '../../frontend/src/assets/logo.jpg');
            if (fs.existsSync(logoPath)) {
                const bitmap = fs.readFileSync(logoPath);
                logoBase64 = 'data:image/jpeg;base64,' + bitmap.toString('base64');
            }
        } catch (e) {
            console.warn("Logo load error", e);
        }

        // 3. Define HTML Template
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                
                body {
                    font-family: 'Roboto', sans-serif;
                    font-size: 12px;
                    color: #000;
                    margin: 0;
                    padding: 40px;
                    line-height: 1.4;
                    position: relative;
                }

                /* LOGO & BRANDING */
                .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                
                .agent-info h1 { font-size: 24px; font-weight: 700; margin: 0 0 10px 0; }
                .agent-info p { margin: 2px 0; font-size: 12px; }

                .brand-section { text-align: right; }
                .logo-img { height: 70px; margin-bottom: 10px; }
                .doc-meta { margin-top: 15px; text-align: right; }
                .doc-meta .row { margin-bottom: 5px; }
                .doc-meta .label { font-weight: 700; margin-right: 15px; }

                /* CLIENT / AGENT COLUMNS */
                .address-section { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 40px; }
                .col { flex: 1; }
                
                .section-title { 
                    border-bottom: 2px solid #000; 
                    font-weight: 700; 
                    text-transform: uppercase; 
                    margin-bottom: 10px; 
                    padding-bottom: 5px;
                    font-size: 11px;
                }

                .info-block { background: #f9f9f9; padding: 10px; min-height: 120px; }
                
                .info-line { margin-bottom: 5px; }
                .info-label { font-weight: 700; }
                .client-name { font-weight: 700; margin-bottom: 5px; font-size: 13px; }

                /* VERTICAL TEXT ON LEFT */
                .vertical-bar {
                    position: absolute;
                    left: 20px;
                    bottom: 150px;
                    transform: rotate(-90deg);
                    transform-origin: 0 0;
                    font-size: 16px;
                    font-weight: 400;
                    letter-spacing: 2px;
                    white-space: nowrap;
                    color: #000;
                }
                .vertical-bar strong { font-weight: 700; }

                /* TABLE */
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 2px solid #000; }
                th { background: #e0e0e0; padding: 8px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #000; }
                td { padding: 8px; border-bottom: 1px solid #ccc; font-size: 11px; }
                
                .text-right { text-align: right; }
                .text-center { text-align: center; }

                /* FOOTER / TOTALS */
                .footer-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; }
                
                .legal-text { font-style: italic; font-size: 11px; max-width: 50%; }
                .legal-text strong { font-weight: 700; }
                
                .totals-table { width: 250px; border: 2px solid #000; margin-left: auto; }
                .totals-row { display: flex; justify-content: space-between; padding: 5px 10px; border-bottom: 1px solid #000; }
                .totals-row:last-child { border-bottom: none; font-weight: 700; font-size: 14px; background: #e0e0e0; }
                .totals-row .val { font-weight: 700; }

                /* STAMP */
                .stamp-container { 
                    position: absolute; 
                    bottom: 40px; 
                    left: 45%; 
                    transform: translateX(-50%) rotate(-5deg);
                    border: 3px solid #555;
                    border-radius: 10px;
                    padding: 10px 20px;
                    text-align: center;
                    color: #555;
                    font-weight: 700;
                    font-family: 'Courier New', Courier, monospace;
                    opacity: 0.8;
                }
                .stamp-title { font-size: 10px; text-transform: uppercase; margin-bottom: 5px; }

            </style>
        </head>
        <body>

            <!-- VERTICAL SIDE BAR -->
            <div class="vertical-bar">
                ${data.typeDocument || 'DOCUMENT'} <strong>N°${data.reference || 'PROVISOIRE'}</strong>
            </div>

            <!-- HEADER -->
            <div class="header-row">
                <div class="agent-info">
                    <h1>Yassine Ben Cheikh</h1>
                    <p>MF: 1946210Y</p>
                    <p>Tel: 96 902 559</p>
                    <p>4116, Iset Djerba, Midoun</p>
                </div>
                <div class="brand-section">
                    ${logoBase64 ? `<img src="${logoBase64}" class="logo-img" />` : '<h1>DIZY</h1>'}
                    <div class="doc-meta">
                        <div class="row"><span class="label">Numéro</span> ${data.reference}</div>
                        <div class="row"><span class="label">Date</span> ${data.dateFormatted}</div>
                    </div>
                </div>
            </div>

            <!-- ADDRESS BLOCKS -->
            <div class="address-section">
                <div class="col">
                    <div class="section-title">DE</div>
                    <div class="info-block">
                        <div class="client-name">Yassine Ben Cheikh</div>
                        <div class="info-line"><span class="info-label">Relevé d'identité bancaire (RIB):</span></div>
                        <div class="info-line">01014055113031239493</div>
                        <div class="info-line"><span class="info-label">Matricule Fiscal:</span></div>
                        <div class="info-line">1946210Y</div>
                    </div>
                </div>

                <div class="col">
                    <div class="section-title">À</div>
                    <div class="info-block">
                        <div class="client-name">${(data.clientDetailsSnapshot?.entreprise || (data.clientDetailsSnapshot?.nom ? data.clientDetailsSnapshot.nom + ' ' + (data.clientDetailsSnapshot.prenom || '') : 'Client Inconnu'))}</div>
                        
                        <div class="info-line">${data.clientDetailsSnapshot?.email || ''}</div>
                        
                        <div class="info-line"><span class="info-label">RIB:</span></div>
                        <div class="info-line">${data.clientDetailsSnapshot?.rib || 'Non renseigné'}</div>
                        
                        <div class="info-line"><span class="info-label">Matricule Fiscal:</span></div>
                        <div class="info-line">${data.clientDetailsSnapshot?.matricule || 'Non renseigné'}</div>
                        
                        <div class="info-line"><span class="info-label">Adresse:</span></div>
                        <div class="info-line">${data.clientDetailsSnapshot?.adresse || ''}</div>
                    </div>
                </div>
            </div>

            <!-- TABLE -->
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%">RÉFÉRENCE</th>
                        <th>DESCRIPTION</th>
                        <th class="text-right" style="width: 10%">QUANTITÉ</th>
                        <th class="text-right" style="width: 15%">MONTANT</th>
                        <th class="text-right" style="width: 10%">TAXES</th>
                        <th class="text-right" style="width: 15%">TOTAL HT</th>
                        <th class="text-right" style="width: 15%">TOTAL TTC</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map(item => `
                    <tr>
                        <td>${item.reference || 'REF'}</td>
                        <td>${item.description || 'Service'}</td>
                        <td class="text-right">${Number(item.quantite) || 1}</td>
                        <td class="text-right">${(Number(item.prixUnitaire) || 0).toFixed(3)}</td>
                        <td class="text-right">${data.tva || 0}%</td>
                        <td class="text-right">${item.totalLine || '0.000'}</td>
                        <td class="text-right">${(Number(item.totalLine || 0) * (1 + (data.tva || 0) / 100)).toFixed(3)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- FOOTER SECTION -->
            <div class="footer-row">
                <div class="legal-text">
                    <p>Arrêter La Présente ${data.typeDocument === 'FACTURE' ? 'Facture' : 'Devis'} A La Somme De:</p>
                    <p><strong>${(Number(data.montantTTC) || 0).toFixed(3)} Dinars (TND)</strong></p>
                </div>

                <div class="totals-table">
                    <div class="totals-row">
                        <span>SOUS-TOTAL</span>
                        <span class="val">${Number(data.montantHT).toFixed(3)} DT</span>
                    </div>
                    <div class="totals-row">
                        <span>TAXES (${data.tva}%)</span>
                        <span class="val">${Number(data.totalTVA).toFixed(3)} DT</span>
                    </div>
                    <div class="totals-row">
                        <span>TOTAL À PAYER</span>
                        <span class="val">${Number(data.montantTTC).toFixed(3)} DT</span>
                    </div>
                </div>
            </div>

            <!-- STAMP -->
            <div class="stamp-container">
                <div class="stamp-title">YASSINE BEN CHEIKH</div>
                4116, ISET DJERBA, MIDOUN<br>
                96 902 559 - MF: 1946210/Y<br>
                RIB: 01014055113031239493
            </div>

        </body>
        </html>
        `;

        // 4. Generate PDF
        const options = {
            format: 'A4',
            margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }, // Managed by body padding
            printBackground: true
        };
        const file = { content: html };
        const pdfBuffer = await html_to_pdf.generatePdf(file, options);

        // 5. Save to Disk
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(outputPath, pdfBuffer);
        return true;

    } catch (e) {
        console.error("PDF Generation failed:", e);
        throw e;
    }
};
