const { body } = require("express-validator");

const allowedRoles = [
  "admin",
  "doctor",
  "nurse",
  "receptionist",
  "patient",
  "pharmacist",
  "lab_manager",
];

const createUserRules = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("roles").optional().isArray().withMessage("roles must be an array"),
  body("roles.*").optional().isIn(allowedRoles).withMessage("Invalid role"),
  body("profile.firstName").optional().isString(),
  body("profile.lastName").optional().isString(),
  body("profile.phone").optional().isString(),
  body("profile.address").optional().isString(),
];

const updateUserRules = [
  body("profile.firstName").optional().isString(),
  body("profile.lastName").optional().isString(),
  body("profile.phone").optional().isString(),
  body("profile.address").optional().isString(),
];

const changePasswordRules = [
  body("oldPassword").isString().notEmpty().withMessage("oldPassword is required"),
  body("newPassword").isString().isLength({ min: 8 }).withMessage("newPassword must be at least 8 characters"),
];

const setSuspendedRules = [
  body("suspended").isBoolean().withMessage("suspended must be boolean"),
];

module.exports = {
  createUserRules,
  updateUserRules,
  changePasswordRules,
  setSuspendedRules,
};


