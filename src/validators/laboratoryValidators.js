const { body, param } = require("express-validator");

const createOrderRules = [
  body("patientId")
    .isMongoId()
    .withMessage("patientId is required and must be a valid MongoDB ID"),
  body("doctorId")
    .isMongoId()
    .withMessage("doctorId is required and must be a valid MongoDB ID"),
  body("consultationId")
    .optional()
    .isMongoId()
    .withMessage("consultationId must be a valid MongoDB ID"),
  body("tests")
    .isArray({ min: 1 })
    .withMessage("tests is required and must be a non-empty array"),
  body("tests.*.testCode")
    .notEmpty()
    .withMessage("testCode is required for each test"),
  body("tests.*.testName")
    .notEmpty()
    .withMessage("testName is required for each test"),
  body("notes").optional().isString().withMessage("notes must be a string"),
];

const addResultRules = [
  param("id")
    .isMongoId()
    .withMessage("id is required and must be a valid MongoDB ID"),
];

const validateResultRules = [
  param("id")
    .isMongoId()
    .withMessage("id is required and must be a valid MongoDB ID"),
];

const presignedRules = [
  param("orderId")
    .isMongoId()
    .withMessage("orderId is required and must be a valid MongoDB ID"),
  param("resultId")
    .isMongoId()
    .withMessage("resultId is required and must be a valid MongoDB ID"),
];

module.exports = {
  createOrderRules,
  addResultRules,
  validateResultRules,
  presignedRules,
};

