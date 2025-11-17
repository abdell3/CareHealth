const { body, query } = require("express-validator");

const createConsultationRules = [
  body("patientId").isString().notEmpty().withMessage("patientId is required"),
  body("doctorId").isString().notEmpty().withMessage("doctorId is required"),
  body("appointmentId").optional().isString(),
  body("notes").optional().isString(),
  body("vitals").optional().isObject(),
  body("diagnoses").optional().isArray(),
  body("procedures").optional().isArray(),
];

const updateConsultationRules = [
  body("notes").optional().isString(),
  body("vitals").optional().isObject(),
  body("diagnoses").optional().isArray(),
  body("procedures").optional().isArray(),
];

const listConsultationsRules = [
  query("patientId").optional().isString(),
];

module.exports = {
  createConsultationRules,
  updateConsultationRules,
  listConsultationsRules,
};

