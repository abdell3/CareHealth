const express = require("express");
const { body, query } = require("express-validator");
const MedicalRecordController = require("../app/Http/Controllers/MedicalRecordController");
const AuthMiddleware = require("../app/Http/Middlewares/AuthMiddleware");

const router = express.Router();

const createValidation = [
  body("patientId").isMongoId().withMessage("Valid patient ID required"),
  body("recordType")
    .isIn(["consultation", "diagnosis", "treatment", "follow-up"])
    .withMessage("Valid record type required"),
  body("diagnosis").optional().isString().trim(),
  body("symptoms").optional().isArray(),
  body("vitalSigns").optional().isObject(),
  body("treatment").optional().isString().trim(),
  body("notes").optional().isString().trim(),
];

const updateValidation = [
  body("diagnosis").optional().isString().trim(),
  body("symptoms").optional().isArray(),
  body("vitalSigns").optional().isObject(),
  body("treatment").optional().isString().trim(),
  body("notes").optional().isString().trim(),
];

router.use(AuthMiddleware.verifyToken);

router.post("/", AuthMiddleware.requireRoles("doctor"), createValidation, MedicalRecordController.create);

router.get("/patient/:patientId", MedicalRecordController.getPatientRecords);

router.get("/doctor/records", AuthMiddleware.requireRoles("doctor"), MedicalRecordController.getDoctorRecords);

router.get("/:id", MedicalRecordController.get);

router.put("/:id", AuthMiddleware.requireRoles("doctor"), updateValidation, MedicalRecordController.update);

router.delete("/:id", AuthMiddleware.requireRoles("doctor"), MedicalRecordController.delete);

module.exports = router;
