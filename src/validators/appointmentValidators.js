const { body } = require("express-validator");

const createAppointmentRules = [
  body("patientId")
    .isMongoId()
    .withMessage("patientId is required and must be a valid MongoDB ID"),
  body("doctorId")
    .isMongoId()
    .withMessage("doctorId is required and must be a valid MongoDB ID"),
  body("startAt")
    .isISO8601()
    .withMessage("startAt is required and must be a valid ISO 8601 date"),
  body("endAt")
    .isISO8601()
    .withMessage("endAt is required and must be a valid ISO 8601 date"),
  body("notes").optional().isString().withMessage("notes must be a string"),
];

const updateAppointmentRules = [
  body("patientId").optional().isMongoId().withMessage("patientId must be a valid MongoDB ID"),
  body("doctorId").optional().isMongoId().withMessage("doctorId must be a valid MongoDB ID"),
  body("startAt").optional().isISO8601().withMessage("startAt must be a valid ISO 8601 date"),
  body("endAt").optional().isISO8601().withMessage("endAt must be a valid ISO 8601 date"),
  body("status")
    .optional()
    .isIn(["scheduled", "completed", "cancelled"])
    .withMessage("status must be one of: scheduled, completed, cancelled"),
  body("notes").optional().isString().withMessage("notes must be a string"),
];

module.exports = {
  createAppointmentRules,
  updateAppointmentRules,
};

