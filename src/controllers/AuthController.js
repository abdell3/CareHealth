const { validationResult } = require("express-validator");
const AuthService = require("../services/AuthService");

class AuthController {
  async register(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const result = await AuthService.register(req.body);
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: e.message,
      });
    }
  }

  async login(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    try {
      const result = await AuthService.login(email, password);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (e) {
      return res.status(401).json({
        success: false,
        message: e.message,
      });
    }
  }

  async refresh(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { refreshToken } = req.body;

    try {
      const tokens = await AuthService.refresh(refreshToken);
      return res.status(200).json({
        success: true,
        data: tokens,
      });
    } catch (e) {
      return res.status(401).json({
        success: false,
        message: e.message,
      });
    }
  }

  async logout(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { refreshToken } = req.body;

    try {
      await AuthService.logout(refreshToken);
      return res.status(200).json({
        success: true,
        message: "Logged out",
      });
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: e.message,
      });
    }
  }
}

module.exports = new AuthController();


