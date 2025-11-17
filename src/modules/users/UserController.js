const { body, validationResult } = require('express-validator');
const UserService = require('./UserService');

class UserController {
  async getAllUsers(req, res) {
    try {
      const users = await UserService.getAllUsers({ role: req.query.role });
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserById(req, res) {
    try {
      const user = await UserService.getUserById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const user = await UserService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const user = await UserService.updateUser(req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      await UserService.deleteUser(req.params.id);
      res.json({ success: true, message: 'User deleted' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async setStatus(req, res) {
    try {
      const { isActive } = req.body;
      const updated = await UserService.setUserStatus(req.params.id, isActive);
      res.json({ success: true, data: updated });
    } catch (error) {
      const code = error.message === 'User not found' ? 404 : 400;
      res.status(code).json({ success: false, message: error.message });
    }
  }
}

module.exports = new UserController();
