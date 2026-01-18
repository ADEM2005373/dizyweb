const jwt = require("jsonwebtoken");

// =======================
// Vérification du token
// =======================
exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Vérifier la présence du token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Accès refusé, token manquant" });
    }

    // Extraire le token
    const token = authHeader.split(" ")[1];

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attacher l'utilisateur décodé à la requête
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

// =======================
// Vérification des rôles
// =======================
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role ? req.user.role.toLowerCase() : "";
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Accès interdit" });
    }
    next();
  };
};

// =======================
// Vérification Optionnelle (Public + Auth Mix)
// =======================
exports.verifyTokenOptional = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      console.warn("Optional Token Invalid:", error.message);
      // Valid token provided but expired/bad -> Treat as Public user (or could return 401 if stricter)
      // For now, treat as public
    }
  }
  next();
};
