const jwt = require('jsonwebtoken');
const UserRepository = require('../../Repositories/UserRepository');
const config = require('../../../config/config.json');

class AuthMiddleware {
  async verifyToken(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await UserRepository.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }

  requireRoles(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user || !req.user.role || !req.user.role.name) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (!allowedRoles.includes(req.user.role.name)) {
        return res.status(403).json({ message: 'Insufficient role' });
      }
      next();
    };
  }

  requireAdmin(req, res, next) {
    return this.requireRoles('admin')(req, res, next);
  }

  requireDoctor(req, res, next) {
    return this.requireRoles('admin', 'doctor')(req, res, next);
  }

  requireMedicalStaff(req, res, next) {
    return this.requireRoles('admin', 'doctor', 'nurse')(req, res, next);
  }

  requireStaff(req, res, next) {
    return this.requireRoles('admin', 'doctor', 'nurse', 'secretary')(req, res, next);
  }
}

module.exports = new AuthMiddleware();
