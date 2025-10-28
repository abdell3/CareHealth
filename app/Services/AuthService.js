const jwt = require('jsonwebtoken');
const UserModel = require('../Models/User');
const RoleModel = require('../Models/Role');
const PatientService = require('./PatientService');
const config = require('../../config/config.json');

class AuthService {
  constructor() {
    this.jwtSecret = config.jwt.secret;
    this.jwtRefreshSecret = config.jwt.refreshSecret;
    this.accessTokenExpires = config.jwt.expiresIn;
    this.refreshTokenExpires = config.jwt.refreshExpiresIn;
  }

  async register(userData) {
    const { firstName, lastName, email, password, role = 'patient', phone } = userData;
    const User = UserModel.getModel();
    const Role = RoleModel.getModel();

    const exist = await User.findByEmail(email);
    if (exist) {
      throw new Error('User already exists with this email');
    }

    if (role !== 'patient') {
      throw new Error('Only patient self-registration is allowed. Staff accounts must be created by administrators.');
    }

    const roleDoc = await Role.findByName(role);
    if (!roleDoc) {
      throw new Error(`Role '${role}' not found`);
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: roleDoc._id, 
      phone
    });

    await user.save();

    if (role === 'patient') {
      await PatientService.create({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        user: user._id
      });
    }

    const tokens = this.generateTokens(user);
    
    return {
      user: this.sanitizeUser(user),
      tokens
    };
  }

  async login(email, password) {
    const User = UserModel.getModel();
    const user = await User.findOne({ email: email }).select('+password');
    console.log('--- DÉBOGAGE LOGIN --- \nUtilisateur trouvé:', user, '\nMot de passe reçu:', password, '\nemail' , email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    user.lastLogin = new Date();
    await user.save();

    const tokens = this.generateTokens(user);
    
    return {
      user: this.sanitizeUser(user),
      tokens
    };
  }

  async refreshToken(refreshToken) {
    try {
      const verify = jwt.verify(refreshToken, this.jwtRefreshSecret);
      const User = UserModel.getModel();
      const user = await User.findById(verify.userId);
      
      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      const tokens = this.generateTokens(user);
      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async resetPassword(email) {
    const User = UserModel.getModel();
    const user = await User.findByEmail(email);
    
    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    return resetToken;
  }

  async updatePassword(resetToken, newPassword) {
    const hashedToken = require('crypto')
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const User = UserModel.getModel();
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();
    
    return true;
  }

  generateTokens(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpires
    });

    const refreshToken = jwt.sign(
      { userId: user._id },
      this.jwtRefreshSecret,
      { expiresIn: this.refreshTokenExpires }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpires
    };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  sanitizeUser(user) {
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.passwordResetToken;
    delete userObj.passwordResetExpires;
    return userObj;
  }
}

module.exports = new AuthService();
