const { verifyAccessToken } = require("../utils/jwt");

function requireAuth(req, res, next) {
  const header = req.headers["authorization"] || req.headers["Authorization"];

  if (!header || typeof header !== "string") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = parts[1];

  try {
    const decoded = verifyAccessToken(token);
    const id = decoded.userId || decoded.id;

    if (!id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = {
      id,
      role: decoded.role,
    };

    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = requireAuth;


