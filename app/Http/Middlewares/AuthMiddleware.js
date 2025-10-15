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

  requireAdmin(req, res, next) {
    if (req.user.role.name !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  }
}

module.exports = new AuthMiddleware();
