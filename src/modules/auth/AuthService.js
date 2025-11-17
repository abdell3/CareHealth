const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const UserModel = require('../users/User');
const RoleModel = require('../users/Role');
const PatientService = require('../patients/PatientService');
const RefreshTokenModel = require('./RefreshToken');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTokenExpires = process.env.JWT_ACCESS_EXPIRES || '15m';
    this.refreshTokenExpires = process.env.JWT_REFRESH_EXPIRES || '7d';
    this.RefreshToken = RefreshTokenModel.getModel();
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
      phone,
    });

    await user.save();

    const patientPayload = {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      user: user._id,
    };
    if (userData.dateOfBirth) {
      patientPayload.dateOfBirth = userData.dateOfBirth;
    }
    if (userData.gender) {
      patientPayload.gender = userData.gender;
    }
    await PatientService.create(patientPayload);

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async login(email, password) {
    const User = UserModel.getModel();
    const user = await User.findOne({ email }).select('+password');
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

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
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
    const hashedToken = require('crypto').createHash('sha256').update(resetToken).digest('hex');

    const User = UserModel.getModel();
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
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

  async generateTokens(user) {
    this.ensureSecrets();

    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpires,
    });

    const refreshPayload = {
      userId: user._id,
      tokenId: uuidv4(),
    };

    const refreshToken = jwt.sign(refreshPayload, this.jwtRefreshSecret, {
      expiresIn: this.refreshTokenExpires,
    });

    const refreshExpiresAt = new Date(Date.now() + this.parseExpiryToMs(this.refreshTokenExpires));

    await this.RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: refreshExpiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpires,
    };
  }

  verifyToken(token) {
    this.ensureSecrets();
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  verifyRefreshToken(refreshToken) {
    this.ensureSecrets();
    return jwt.verify(refreshToken, this.jwtRefreshSecret);
  }

  async findRefreshToken(token) {
    return this.RefreshToken.findOne({ token });
  }

  async revokeRefreshToken(token) {
    if (!token) {
      return;
    }
    await this.RefreshToken.deleteOne({ token });
  }

  async getActiveUserById(userId) {
    const User = UserModel.getModel();
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }

  parseExpiryToMs(value) {
    if (!value) {
      return 7 * 24 * 60 * 60 * 1000;
    }
    if (/^\d+$/.test(value)) {
      return Number(value) * 1000;
    }
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }
    const amount = Number(match[1]);
    const unit = match[2];
    const unitMap = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return amount * unitMap[unit];
  }

  ensureSecrets() {
    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets are not configured');
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
