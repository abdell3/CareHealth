const { body } = require("express-validator");

const registerRules = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("role").optional().isString(),
];

const loginRules = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const refreshRules = [
  body("refreshToken").isString().notEmpty().withMessage("refreshToken is required"),
];

module.exports = {
  registerRules,
  loginRules,
  refreshRules,
};


