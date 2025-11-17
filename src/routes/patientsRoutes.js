const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const requireRole = require("../middlewares/requireRole");
const PatientController = require("../controllers/PatientController");
const {
  createPatientRules,
  updatePatientRules,
  searchRules,
} = require("../validators/patientValidators");

const router = express.Router();

router.post(
  "/patients",
  requireAuth,
  requireRole("admin", "receptionist", "nurse"),
  createPatientRules,
  PatientController.createPatient
);

router.get(
  "/patients",
  requireAuth,
  requireRole("admin", "receptionist", "doctor", "nurse"),
  searchRules,
  PatientController.listPatients
);

router.get(
  "/patients/:id",
  requireAuth,
  PatientController.getPatient
);

router.put(
  "/patients/:id",
  requireAuth,
  updatePatientRules,
  PatientController.updatePatient
);

router.delete(
  "/patients/:id",
  requireAuth,
  requireRole("admin"),
  PatientController.deletePatient
);

module.exports = router;


