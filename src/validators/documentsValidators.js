const { param } = require("express-validator");

const uploadDocumentRules = [
  param("id").isMongoId().withMessage("patientId must be a valid MongoDB ID"),
];

const presignedRules = [
  param("patientId").isMongoId().withMessage("patientId must be a valid MongoDB ID"),
  param("docId").isMongoId().withMessage("docId must be a valid MongoDB ID"),
];

const listDocumentsRules = [
  param("patientId").isMongoId().withMessage("patientId must be a valid MongoDB ID"),
];

const deleteDocumentRules = [
  param("patientId").isMongoId().withMessage("patientId must be a valid MongoDB ID"),
  param("docId").isMongoId().withMessage("docId must be a valid MongoDB ID"),
];

module.exports = {
  uploadDocumentRules,
  presignedRules,
  listDocumentsRules,
  deleteDocumentRules,
};

