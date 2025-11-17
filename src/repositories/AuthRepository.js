const { RefreshToken } = require("../models");

async function createToken({ userId, token, expiresAt }) {
  const record = new RefreshToken({
    user: userId,
    token,
    expiresAt,
  });
  return record.save();
}

async function findByToken(token) {
  return RefreshToken.findOne({ token });
}

async function deleteByToken(token) {
  return RefreshToken.deleteOne({ token });
}

async function deleteByUser(userId) {
  return RefreshToken.deleteMany({ user: userId });
}

async function deleteExpired(now = new Date()) {
  return RefreshToken.deleteMany({ expiresAt: { $lte: now } });
}

module.exports = {
  createToken,
  findByToken,
  deleteByToken,
  deleteByUser,
  deleteExpired,
};


