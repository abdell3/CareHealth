const bcrypt = require("bcrypt");
const { User } = require("../models");
const AuthRepository = require("../repositories/AuthRepository");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

function parseExpiresToMs(value) {
  if (!value) {
    return 0;
  }
  if (/^\d+$/.test(value)) {
    return Number(value) * 1000;
  }
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    return 0;
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const unitMap = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * (unitMap[unit] || 0);
}

class AuthService {
  async register(data) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = new User({
      ...data,
      password: hashedPassword,
    });

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj };
  }

  async login(email, password) {
    const userQuery = User.findOne({ email });
    const user = userQuery.select ? await userQuery.select("+password") : await userQuery;

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const refreshTtlMs = parseExpiresToMs(process.env.JWT_REFRESH_EXPIRES);
    const expiresAt =
      refreshTtlMs > 0 ? new Date(Date.now() + refreshTtlMs) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await AuthRepository.createToken({
      userId: user._id,
      token: refreshToken,
      expiresAt,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return {
      user: userObj,
      accessToken,
      refreshToken,
    };
  }

  async refresh(oldRefreshToken) {
    const decoded = verifyRefreshToken(oldRefreshToken);

    const stored = await AuthRepository.findByToken(oldRefreshToken);
    if (!stored || stored.user.toString() !== decoded.userId) {
      throw new Error("Invalid refresh token");
    }

    await AuthRepository.deleteByToken(oldRefreshToken);

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const payload = { userId: user._id.toString(), role: user.role };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    const refreshTtlMs = parseExpiresToMs(process.env.JWT_REFRESH_EXPIRES);
    const expiresAt =
      refreshTtlMs > 0 ? new Date(Date.now() + refreshTtlMs) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await AuthRepository.createToken({
      userId: user._id,
      token: newRefreshToken,
      expiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken) {
    await AuthRepository.deleteByToken(refreshToken);
  }
}

module.exports = new AuthService();


