const { body, param } = require("express-validator");

const createPharmacyRules = [
  body("name").notEmpty().withMessage("name is required"),
  body("identifier").notEmpty().withMessage("identifier is required"),
  body("address").optional().isObject(),
  body("address.line1").optional().isString(),
  body("address.city").optional().isString(),
  body("address.postalCode").optional().isString(),
  body("address.country").optional().isString(),
  body("contact").optional().isObject(),
  body("contact.phone").optional().isString(),
  body("contact.email").optional().isEmail(),
  body("hours").optional().isArray(),
  body("enabled").optional().isBoolean(),
];

const updatePharmacyRules = [
  body("name").optional().notEmpty(),
  body("identifier").optional().notEmpty(),
  body("address").optional().isObject(),
  body("contact").optional().isObject(),
  body("hours").optional().isArray(),
  body("enabled").optional().isBoolean(),
];

const assignPrescriptionRules = [
  param("id").isMongoId().withMessage("id must be a valid MongoDB ID"),
  body("prescriptionId")
    .isMongoId()
    .withMessage("prescriptionId is required and must be a valid MongoDB ID"),
];

const updatePrescriptionStatusRules = [
  param("id").isMongoId().withMessage("id must be a valid MongoDB ID"),
  param("prescriptionId").isMongoId().withMessage("prescriptionId must be a valid MongoDB ID"),
  body("status")
    .isIn(["draft", "signed", "sent", "dispensed", "unavailable"])
    .withMessage("status must be one of: draft, signed, sent, dispensed, unavailable"),
];

const getPharmacyRules = [
  param("id").isMongoId().withMessage("id must be a valid MongoDB ID"),
];

const listAssignedPrescriptionsRules = [
  param("pharmacyId")
    .optional()
    .isMongoId()
    .withMessage("pharmacyId must be a valid MongoDB ID"),
];

module.exports = {
  createPharmacyRules,
  updatePharmacyRules,
  assignPrescriptionRules,
  updatePrescriptionStatusRules,
  getPharmacyRules,
  listAssignedPrescriptionsRules,
};

