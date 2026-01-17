const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Import models to register discriminators
const User = require("./models/User");
const Agent = require("./models/Agent");
const Client = require("./models/Client");

const app = express();


app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api/", limiter);

app.use(cors());
app.use(express.json());
app.use("/uploads/portfolio", express.static(path.join(__dirname, "uploads/portfolio")));
app.use("/uploads/documents", express.static(path.join(__dirname, "uploads/documents")));

// Charger les modèles (Important pour les discriminateurs et la population)
require("./models/User");
require("./models/Admin");
require("./models/Client");
require("./models/Agent");
require("./models/RendezVous");
require("./models/Portfolio");
require("./models/ElementPortfolio");
require("./models/Pack");
require("./models/DocumentCommerciaux");

// Routes Auth
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

// Routes Client
const clientRoutes = require("./routes/client.routes");
app.use("/api/clients", clientRoutes);

// Routes Agent (si déjà créées)
const agentRoutes = require("./routes/agent.routes");
app.use("/api/agents", agentRoutes);

//rendezvous routes
const rendezVousRoutes = require("./routes/rendezvous.routes");
app.use("/api/rendezvous", rendezVousRoutes);
//routes pack 
//routes pack 
const packRoutes = require("./routes/pack.routes");
app.use("/api/packs", packRoutes);

//routes users (Generic)
const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

//routes notification
const notificationRoutes = require("./routes/notification.routes");
app.use("/api/notifications", notificationRoutes); // Pluralized

//pelement routes
const elementPortfolioRoutes = require("./routes/elementPortfolio.routes");
app.use("/api/elementPortfolios", elementPortfolioRoutes); // Pluralized

//portfolio routes
const portfolioRoutes = require("./routes/portfolio.routes");
app.use("/api/portfolios", portfolioRoutes); // Pluralized

const documentCommerciauxRoutes = require("./routes/documentCommerciaux.routes");
app.use("/api/documentCommerciaux", documentCommerciauxRoutes); // Already mostly correct, leaving as is

const templateRoutes = require("./routes/templateDocument.routes");
app.use("/api/templateDocuments", templateRoutes);


module.exports = app;
