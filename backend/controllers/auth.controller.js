const User = require("../models/User");
const Client = require("../models/Client");
const Agent = require("../models/Agent");
const Admin = require("../models/Admin");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

// Utility function to get admin email - CRITICAL: Use .env as primary source
const getAdminEmail = async () => {
  try {
    // Priority 1: Check if .env has ADMIN_EMAIL configured
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.trim() && process.env.ADMIN_EMAIL !== 'admin@dizzy.com') {
      console.log('[EMAIL] Using ADMIN_EMAIL from .env:', process.env.ADMIN_EMAIL);
      return process.env.ADMIN_EMAIL.trim();
    }

    // Priority 2: Check database for admin email (in case admin updated their email in profile)
    const admin = await Admin.findOne().exec();
    if (admin && admin.email && admin.email.trim()) {
      console.log('[EMAIL] Using admin email from database:', admin.email);
      return admin.email.trim();
    }

    // Fallback
    console.log('[EMAIL] Warning: Using default email - please set ADMIN_EMAIL in .env');
    return 'admin@dizzy.com';
  } catch (error) {
    console.error("[EMAIL] Error getting admin email:", error);
    const fallback = (process.env.ADMIN_EMAIL || 'admin@dizzy.com').trim();
    console.log('[EMAIL] Error occurred, using:', fallback);
    return fallback;
  }
};

// =======================
// REGISTER (CLIENT)
// =======================
exports.register = async (req, res) => {
  console.log('[REGISTRATION] Register function called with:', req.body);
  try {
    const { nom, prenom, email, motDePasse, entreprise, secteur, matriculeFiscale, adresse, codePostal, ville, telephone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Compte déjà existant avec cet email" });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const client = await Client.create({
      nom,
      prenom,
      email,
      motDePasse: hashedPassword,
      entreprise,
      secteur,
      matriculeFiscale,
      adresse,
      codePostal,
      ville,
      telephone,
      isApproved: true
    });

    // Send notification to Admin (Information only)
    console.log('[REGISTRATION] About to send email notification...');
    try {
      const adminEmail = await getAdminEmail();
      console.log(`[REGISTRATION] Sending notification to admin email: ${adminEmail}`);

      if (!adminEmail || !adminEmail.trim()) {
        console.warn('[REGISTRATION] Warning: Admin email is empty');
      }

      const emailResult = await sendEmail({
        to: adminEmail,
        subject: "Nouvelle demande d'inscription client - DIZY",
        text: `Une nouvelle demande d'inscription client a été reçue.

Informations du client :
- Nom : ${nom}
- Prénom : ${prenom}
- Email : ${email}
- Entreprise : ${entreprise}
- Secteur : ${secteur}
- Matricule Fiscale : ${matriculeFiscale}

Le compte a été créé et activé automatiquement.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Nouvelle demande d'inscription client</h2>
            <p>Une nouvelle demande d'inscription client a été reçue sur la plateforme DIZY.</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #555;">Informations du client :</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Nom :</strong> ${nom}</li>
                <li><strong>Prénom :</strong> ${prenom}</li>
                <li><strong>Email :</strong> ${email}</li>
                <li><strong>Entreprise :</strong> ${entreprise}</li>
                <li><strong>Secteur :</strong> ${secteur}</li>
                <li><strong>Matricule Fiscale :</strong> ${matriculeFiscale}</li>
              </ul>
            </div>
            
            <p style="color: #28a745;"><strong>Statut :</strong> Compte activé automatiquement.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #777; font-size: 12px;">Cet email a été envoyé automatiquement par le système DIZY.</p>
          </div>
        `
      });

      console.log('[REGISTRATION] Email sending result:', emailResult);
    } catch (emailError) {
      console.error('[REGISTRATION] Error sending notification email:', emailError);
      // Continue with registration even if email fails
    }

    // Create notification for admin
    try {
      const admin = await Admin.findOne();
      if (admin) {
        await Notification.create({
          utilisateur: admin._id,
          message: `Nouvelle demande d'inscription client: ${prenom} ${nom} (${entreprise})`,
          lu: false,
          date: new Date()
        });
        console.log('[REGISTRATION] Notification created for admin');
      }
    } catch (notifError) {
      console.error('[REGISTRATION] Error creating notification:', notifError);
    }

    return res.status(201).json({
      message: "Compte client créé avec succès",
      clientId: client._id
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Erreur lors de l'inscription", error: error.message });
  }
};

// =======================
// LOGIN (UNIFIED)
// =======================
exports.login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    // Find User regardless of role
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Compte non trouvé" });
    }

    // Check password
    const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // Check approval status (REMOVED as per user request)
    // if (roleLower !== 'admin' && !user.isApproved) {
    //   return res.status(403).json({ message: "Compte non validé par l'administrateur" });
    // }

    // Generate Token (Normalize role to lowercase for frontend/middleware consistency)
    const normalizedRole = user.role ? user.role.toLowerCase() : "";
    const token = jwt.sign(
      { id: user._id, role: normalizedRole },
      process.env.JWT_SECRET || 'secret_dev_key', // Fallback for dev
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Connexion réussie",
      token,
      user: {
        id: user._id,
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: normalizedRole,
        imageProfile: user.imageProfile,
        entreprise: user.entreprise,
        agentPrincipal: user.agentPrincipal
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// =======================
// SEED ADMIN (DEV ONLY)
// =======================
exports.seedAdmin = async (req, res) => {
  try {
    const email = process.env.ADMIN_EMAIL || "admin@dizzy.com";
    const password = process.env.ADMIN_PASSWORD || "admin123";

    let admin = await User.findOne({ email });
    if (admin) {
      // Update existing admin if needed
      admin.nom = admin.nom || "Admin";
      admin.prenom = admin.prenom || "System";
      admin.isApproved = true;
      await admin.save();
      return res.status(200).json({ message: "Admin already exists and updated" });
    }

    // Check if admin exists with different email
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      // Update the existing admin's email
      existingAdmin.email = email;
      existingAdmin.nom = existingAdmin.nom || "Admin";
      existingAdmin.prenom = existingAdmin.prenom || "System";
      existingAdmin.isApproved = true;
      await existingAdmin.save();
      return res.status(200).json({ message: "Existing admin updated with new email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      nom: "Admin",
      prenom: "System",
      email,
      motDePasse: hashedPassword,
      isApproved: true,
      permissions: ["all"]
    });

    res.status(201).json({ message: "Admin seeded successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
