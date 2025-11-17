const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const requireRole = require("../middlewares/requireRole");
const { validate } = require("../core/middlewares/validate");
const { upload, validateFileType } = require("../core/middlewares/upload");
const LaboratoryController = require("../controllers/LaboratoryController");
const {
  createOrderRules,
  addResultRules,
  validateResultRules,
  presignedRules,
} = require("../validators/laboratoryValidators");

const router = express.Router();

const ALLOWED_RESULT_MIME_TYPES = ["application/pdf", "text/csv", "application/vnd.ms-excel"];

router.post(
  "/lab/orders",
  requireAuth,
  requireRole("doctor", "nurse", "admin"),
  createOrderRules,
  validate,
  LaboratoryController.createOrder
);

router.get(
  "/lab/orders/:id",
  requireAuth,
  LaboratoryController.getOrder
);

router.post(
  "/lab/orders/:id/results",
  requireAuth,
  requireRole("lab_manager", "lab_technician", "admin"),
  addResultRules,
  validate,
  upload.single("file"),
  validateFileType(ALLOWED_RESULT_MIME_TYPES),
  LaboratoryController.addResult
);

router.get(
  "/lab/orders/:orderId/results/:resultId/presigned",
  requireAuth,
  presignedRules,
  validate,
  LaboratoryController.getResultPresigned
);

router.put(
  "/lab/results/:id/validate",
  requireAuth,
  requireRole("doctor", "lab_manager", "admin"),
  validateResultRules,
  validate,
  LaboratoryController.validateResult
);

module.exports = router;

