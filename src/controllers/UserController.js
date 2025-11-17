const { validationResult } = require("express-validator");
const UserService = require("../services/UserService");

const allowedRoles = [
  "admin",
  "doctor",
  "nurse",
  "receptionist",
  "patient",
  "pharmacist",
  "lab_manager",
];

function isAdmin(req) {
  return req.user && req.user.role === "admin";
}

function isSelf(req, userId) {
  return req.user && req.user.id && req.user.id.toString() === userId.toString();
}

class UserController {
  async createUser(req, res) {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password, roles, profile } = req.body;

    try {
      const user = await UserService.createUser({
        email,
        password,
        roles,
        profile,
      });
      return res.status(201).json({ success: true, data: user });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async getUser(req, res) {
    const targetId = req.params.id;

    if (!isAdmin(req) && !isSelf(req, targetId)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    try {
      const user = await UserService.getUserById(targetId);
      return res.status(200).json({ success: true, data: user });
    } catch (e) {
      if (e.message === "User not found") {
        return res.status(404).json({ success: false, message: e.message });
      }
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async listUsers(req, res) {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const filter = {};
    if (req.query.role && allowedRoles.includes(req.query.role)) {
      filter.roles = req.query.role;
    }
    if (typeof req.query.suspended !== "undefined") {
      if (req.query.suspended === "true") {
        filter.suspended = true;
      } else if (req.query.suspended === "false") {
        filter.suspended = false;
      }
    }

    try {
      const users = await UserService.listUsers(filter);
      return res.status(200).json({ success: true, data: users });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  async updateUser(req, res) {
    const targetId = req.params.id;

    if (!isAdmin(req) && !isSelf(req, targetId)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const payload = { ...req.body };
    delete payload.password;
    delete payload.passwordHash;
    delete payload.roles;

    try {
      const user = await UserService.updateUser(targetId, payload);
      return res.status(200).json({ success: true, data: user });
    } catch (e) {
      if (e.message === "User not found") {
        return res.status(404).json({ success: false, message: e.message });
      }
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async setSuspended(req, res) {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { suspended } = req.body;
    const targetId = req.params.id;

    try {
      const user = await UserService.setSuspended(targetId, suspended);
      return res.status(200).json({ success: true, data: user });
    } catch (e) {
      if (e.message === "User not found") {
        return res.status(404).json({ success: false, message: e.message });
      }
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async changePassword(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { oldPassword, newPassword } = req.body;

    try {
      const user = await UserService.changePassword(userId, oldPassword, newPassword);
      return res.status(200).json({ success: true, data: user });
    } catch (e) {
      if (e.message === "Old password is incorrect") {
        return res.status(400).json({ success: false, message: e.message });
      }
      if (e.message === "User not found") {
        return res.status(404).json({ success: false, message: e.message });
      }
      return res.status(400).json({ success: false, message: e.message });
    }
  }
}

module.exports = new UserController();


