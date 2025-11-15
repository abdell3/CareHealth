const { body, validationResult } = require('express-validator');
const AuthService = require('../../Services/AuthService');

const extractRefreshToken = (req) => req.body.refreshToken || req.cookies?.refreshToken;

class AuthController {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const result = await AuthService.register(req.body);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  async refresh(req, res) {
    try {
      const refreshToken = extractRefreshToken(req);

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      const payload = AuthService.verifyRefreshToken(refreshToken);
      const storedToken = await AuthService.findRefreshToken(refreshToken);

      if (!storedToken || storedToken.expiresAt <= new Date()) {
        await AuthService.revokeRefreshToken(refreshToken);
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
      }

      const user = await AuthService.getActiveUserById(payload.userId);
      if (!user) {
        await AuthService.revokeRefreshToken(refreshToken);
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
      }

      await AuthService.revokeRefreshToken(refreshToken);
      const tokens = await AuthService.generateTokens(user);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email } = req.body;
      await AuthService.resetPassword(email);
      
      res.json({
        success: true,
        message: 'Password reset token sent to email'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updatePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { resetToken, newPassword } = req.body;
      await AuthService.updatePassword(resetToken, newPassword);
      
      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async logout(req, res) {
    try {
      const refreshToken = extractRefreshToken(req);

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      await AuthService.revokeRefreshToken(refreshToken);

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Unable to logout',
      });
    }
  }
}

module.exports = new AuthController();
