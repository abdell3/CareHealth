const jwt = require("jsonwebtoken");
const config = require("../config/config");

function resolveExpires(value) {
  if (!value) {
    return undefined;
  }
  return value;
}

function signAccessToken(payload) {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: resolveExpires(config.JWT_ACCESS_EXPIRES),
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: resolveExpires(config.JWT_REFRESH_EXPIRES),
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};


