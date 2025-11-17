function requireRole(...roles) {
  return function (req, res, next) {
    const userRole = req.user && req.user.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}

module.exports = requireRole;


