const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const requireRole = require("../middlewares/requireRole");
const { validate } = require("../core/middlewares/validate");
const { upload, validateFileType, DEFAULT_ALLOWED_MIME_TYPES } = require("../core/middlewares/upload");
const MedicalDocumentController = require("../controllers/MedicalDocumentController");
const {
  uploadDocumentRules,
  presignedRules,
  listDocumentsRules,
  deleteDocumentRules,
} = require("../validators/documentsValidators");

const router = express.Router();

router.post(
  "/patients/:id/documents",
  requireAuth,
  requireRole("doctor", "nurse", "receptionist", "admin", "patient"),
  upload.single("file"),
  validateFileType(DEFAULT_ALLOWED_MIME_TYPES),
  uploadDocumentRules,
  validate,
  MedicalDocumentController.uploadDocument
);

router.get(
  "/patients/:patientId/documents/:docId/presigned",
  requireAuth,
  presignedRules,
  validate,
  MedicalDocumentController.getPresignedUrl
);

router.get(
  "/patients/:patientId/documents",
  requireAuth,
  listDocumentsRules,
  validate,
  MedicalDocumentController.listDocuments
);

router.delete(
  "/patients/:patientId/documents/:docId",
  requireAuth,
  deleteDocumentRules,
  validate,
  MedicalDocumentController.deleteDocument
);

module.exports = router;

