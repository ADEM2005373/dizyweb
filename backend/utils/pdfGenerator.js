const html_to_pdf = require('html-pdf-node');
const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Generate a PDF from a template and data
 * @param {Object} template - The template object from DB
 * @param {Object} data - The data to inject into the template
 * @param {String} outputPath - Local path where to save the PDF
 */
exports.generatePDF = async (template, data, outputPath) => {
    try {
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        if (template.typeTemplate === 'PDF' && template.pdfTemplatePath) {
            return await this.generateFromPDFTemplate(template, data, outputPath);
        } else {
            return await this.generateFromHTMLTemplate(template, data, outputPath);
        }
    } catch (error) {
        console.error("PDF Generation Error:", error);
        throw error;
    }
};

exports.generateFromHTMLTemplate = async (template, data, outputPath) => {
    const combinedHTML = `
        <html>
            <head>
                <style>${template.styleCSS || ''}</style>
            </head>
            <body>
                ${template.contenueHTML}
            </body>
        </html>
    `;
    const compiledTemplate = handlebars.compile(combinedHTML);
    const finalHTML = compiledTemplate(data);

    let options = {
        format: 'A4',
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    };
    let file = { content: finalHTML };
    const pdfBuffer = await html_to_pdf.generatePdf(file, options);
    fs.writeFileSync(outputPath, pdfBuffer);
    return true;
};

exports.generateFromPDFTemplate = async (template, data, outputPath) => {
    // Determine path: support both relative to project root and relative to current file if needed
    // The controller will pass robust paths now
    const fullTemplatePath = path.isAbsolute(template.pdfTemplatePath)
        ? template.pdfTemplatePath
        : path.join(__dirname, '..', template.pdfTemplatePath);

    if (!fs.existsSync(fullTemplatePath)) {
        console.error("Template not found:", fullTemplatePath);
        throw new Error("Template PDF file not found at " + fullTemplatePath);
    }

    const existingPdfBytes = fs.readFileSync(fullTemplatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const courierFont = await pdfDoc.embedFont(StandardFonts.CourierBold);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Helper for drawing text
    const drawText = (text, x, y, size = 10, color = rgb(0, 0, 0)) => {
        try {
            firstPage.drawText(String(text || ''), { x, y, size, font: courierFont, color });
        } catch (e) { console.error("Error drawing text:", text, e); }
    };

    // COORDINATES FOR "FIXED" TEMPLATE (Approximate based on standard layouts)
    // We assume the template provided has the design (Logo, Footer, Boxes).
    // We just fill in the blanks.

    // Header Info
    drawText(data.reference, 120, height - 165, 11); // Reference position
    drawText(data.date, 450, height - 165, 11);      // Date position

    // Client Info (Usually right side or specific box)
    const clientBlockY = height - 230;
    const clientBlockX = 40; // Left aligned often, or right. defaulting to left if standard letter.
    // User said "comme les exemple", typical french layout: client is often right-mid.
    // Let's assume standard position:
    // Emetteur (Left), Destinataire (Right)
    drawText(data.client_entreprise || (data.client_prenom + ' ' + data.client_nom), 350, clientBlockY, 11);
    drawText(data.client_prenom + ' ' + data.client_nom, 350, clientBlockY - 15, 10);
    // Address if we had it, skipping for now.

    // Content Table
    const tableStartsY = height - 350;
    const colDescX = 50;
    const colQtyX = 350;
    const colPriceX = 420;
    const colTotalX = 500;

    // Line 1
    drawText(data.commentaire || 'Service', colDescX, tableStartsY, 10);
    drawText('1', colQtyX, tableStartsY, 10);
    drawText(`${data.montant_ht} €`, colPriceX, tableStartsY, 10);
    drawText(`${data.montant_ht} €`, colTotalX, tableStartsY, 10);

    // Totals Block (Usually bottom right)
    const totalsY = 150; // Just above footer
    const totalsX = 400;
    const valX = 500;

    drawText(`${data.montant_ht} €`, valX, totalsY + 30, 10); // Total HT
    drawText(`${data.tva}%`, valX, totalsY + 15, 10);         // TVA Rate
    drawText(`${(data.montant_ht * data.tva / 100).toFixed(2)} €`, valX, totalsY, 10); // TVA Amount

    // TOTAL TTC (Bold/Large)
    drawText(`${data.montant_ttc} €`, valX, totalsY - 20, 12, rgb(0, 0, 0));

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
};
