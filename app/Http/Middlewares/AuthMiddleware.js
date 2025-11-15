const jwt = require('jsonwebtoken');
const UserRepository = require('../../Repositories/UserRepository');

class AuthMiddleware {
  async verifyToken(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      if (!process.env.JWT_SECRET) {
        throw new Error('Missing JWT secret');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

  
}

module.exports = new AuthMiddleware();
