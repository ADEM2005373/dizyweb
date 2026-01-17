const User = require("../models/User");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");

// GET ALL USERS (with optional role filter)
exports.getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let query = {};
        if (role) {
            // Normalize role to TitleCase (e.g., client -> Client)
            query.role = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
        }
        let users = await User.find(query).select("-motDePasse"); // Exclude password

        // If fetching clients, populate agentPrincipal
        if (role && role.toLowerCase() === 'client') {
            users = await User.find(query)
                .select("-motDePasse")
                .populate("agentPrincipal", "nom prenom email specialite");
        }

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
    try {
        let user = await User.findById(req.params.id).select("-motDePasse");
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        // If user is a client, populate agentPrincipal
        if (user.role === 'Client') {
            user = await User.findById(req.params.id)
                .select("-motDePasse")
                .populate("agentPrincipal", "nom prenom email specialite");
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE USER (Generic Profile Update)
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        // Prevent random users from updating others? 
        // For now, assuming Admin or Self update. Middleware checks auth in routes.

        const { nom, prenom, email, motDePasse, isApproved, agentPrincipal, disponibilites, specialite, entreprise, secteur, matriculeFiscale } = req.body;

        if (nom) user.nom = nom;
        if (prenom) user.prenom = prenom;
        if (email) user.email = email;
        if (isApproved !== undefined) {
            const wasApproved = user.isApproved;
            user.isApproved = isApproved;
            // Notify client if approved
            if (!wasApproved && isApproved && user.role === 'Client') {
                try {
                    await Notification.create({
                        utilisateur: user._id,
                        message: "Votre compte client a été approuvé. Vous pouvez maintenant vous connecter.",
                        lu: false,
                        date: new Date()
                    });
                } catch (notifError) {
                    console.error('Error creating approval notification:', notifError);
                }
            }
        }

        // Client specific - Agent Assignment
        if (agentPrincipal !== undefined) {
            // Normalize: If empty string, set to null
            const validAgentId = (agentPrincipal && agentPrincipal !== "") ? agentPrincipal : null;

            // Validate availability if we are assigning a new agent
            // (Optional: check if validAgentId exists in DB before assigning)

            const oldAgentId = user.agentPrincipal;
            const newAgentId = validAgentId;

            // Comparison using strings to avoid ObjectId vs String issues
            const oldIdStr = oldAgentId ? oldAgentId.toString() : "";
            const newIdStr = newAgentId ? newAgentId.toString() : "";

            // If changing agent assignment
            if (oldIdStr !== newIdStr) {
                // Decrement old agent's client count
                if (oldAgentId) {
                    const oldAgent = await User.findById(oldAgentId);
                    if (oldAgent && oldAgent.role === 'Agent') {
                        oldAgent.nbrClient = Math.max(0, (oldAgent.nbrClient || 0) - 1);
                        await oldAgent.save();
                    }
                }

                // Increment new agent's client count
                if (newAgentId) {
                    const newAgent = await User.findById(newAgentId);
                    if (newAgent && newAgent.role === 'Agent') {
                        newAgent.nbrClient = (newAgent.nbrClient || 0) + 1;
                        await newAgent.save();

                        // NOTIFICATION: Only if newAgent was found
                        try {
                            await Notification.create({
                                utilisateur: user._id,
                                message: `Un agent vous a été assigné: ${newAgent.prenom} ${newAgent.nom} (${newAgent.specialite}).`,
                                lu: false,
                                date: new Date()
                            });
                            await Notification.create({
                                utilisateur: newAgentId,
                                message: `Vous avez été assigné à un nouveau client: ${user.entreprise || user.nom + ' ' + user.prenom}.`,
                                lu: false,
                                date: new Date()
                            });
                        } catch (notifError) {
                            console.error('Error creating assignment notifications:', notifError);
                        }
                    }
                } else {
                    // Agent removed (newAgentId is null)
                    try {
                        await Notification.create({
                            utilisateur: user._id,
                            message: "Votre agent assigné a été retiré.",
                            lu: false,
                            date: new Date()
                        });
                    } catch (notifError) {
                        console.error('Error creating unassignment notification:', notifError);
                    }
                }

                if (oldAgentId) {
                    try {
                        await Notification.create({
                            utilisateur: oldAgentId,
                            message: `Vous n'êtes plus assigné au client: ${user.entreprise || user.nom + ' ' + user.prenom}.`,
                            lu: false,
                            date: new Date()
                        });
                    } catch (notifError) {
                        console.error('Error creating unassignment notification (old agent):', notifError);
                    }
                }
            }

            user.agentPrincipal = newAgentId;
        }
        if (entreprise) user.entreprise = entreprise;
        if (secteur) user.secteur = secteur;
        if (matriculeFiscale) user.matriculeFiscale = matriculeFiscale;

        // Agent specific
        if (disponibilites) user.disponibilites = disponibilites;
        if (specialite) user.specialite = specialite;

        if (motDePasse) {
            const salt = await bcrypt.genSalt(10);
            user.motDePasse = await bcrypt.hash(motDePasse, salt);
        }

        await user.save();

        // Return without password
        const userObj = user.toObject();
        delete userObj.motDePasse;

        res.status(200).json(userObj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
        await user.deleteOne();
        res.status(200).json({ message: "Utilisateur supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
