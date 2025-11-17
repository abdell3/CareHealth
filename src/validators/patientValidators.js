const { body, query } = require("express-validator");

const createPatientRules = [
  body("firstName").isString().notEmpty().withMessage("firstName is required"),
  body("lastName").isString().notEmpty().withMessage("lastName is required"),
  body("dateOfBirth").optional().isISO8601().withMessage("dateOfBirth must be a valid date"),
  body("gender")
    .optional()
    .isIn(["male", "female", "other", "unknown"])
    .withMessage("gender is invalid"),
  body("contacts").optional().isArray(),
  body("contacts.*.type").optional().isString(),
  body("contacts.*.value").optional().isString(),
  body("insurance").optional().isObject(),
  body("insurance.provider").optional().isString(),
  body("insurance.policyNumber").optional().isString(),
  body("allergies").optional().isArray(),
  body("allergies.*").optional().isString(),
];

const updatePatientRules = [
  body("firstName").optional().isString(),
  body("lastName").optional().isString(),
  body("dateOfBirth").optional().isISO8601(),
  body("gender")
    .optional()
    .isIn(["male", "female", "other", "unknown"]),
  body("contacts").optional().isArray(),
  body("contacts.*.type").optional().isString(),
  body("contacts.*.value").optional().isString(),
  body("insurance").optional().isObject(),
  body("insurance.provider").optional().isString(),
  body("insurance.policyNumber").optional().isString(),
  body("allergies").optional().isArray(),
  body("allergies.*").optional().isString(),
];

const searchRules = [
  query("name").optional().isString(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

module.exports = {
  createPatientRules,
  updatePatientRules,
  searchRules,
};


