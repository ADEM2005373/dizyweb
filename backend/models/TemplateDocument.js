const mongoose = require("mongoose");
const templatedocumentSchema = new mongoose.Schema(
    {
        nomTemplate: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        contenueHTML: {
            type: String,
            required: false
        },
        styleCSS: {
            type: String,
            required: false
        },
        typeTemplate: {
            type: String,
            enum: ["HTML", "PDF"],
            default: "HTML"
        },
        pdfTemplatePath: {
            type: String,
            required: false
        },
        actif: {
            type: Boolean,
            required: true
        },
        dateCreation: {
            type: Date,
            required: true
        },
        dateDerniereModification: {
            type: Date,
            required: true
        },
        
    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model("TemplateDocument", templatedocumentSchema);