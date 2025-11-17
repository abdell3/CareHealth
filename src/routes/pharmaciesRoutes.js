const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const requireRole = require("../middlewares/requireRole");
const { validate } = require("../core/middlewares/validate");
const PharmacyController = require("../controllers/PharmacyController");
const {
  createPharmacyRules,
  updatePharmacyRules,
  assignPrescriptionRules,
  updatePrescriptionStatusRules,
  getPharmacyRules,
} = require("../validators/pharmacyValidators");

const router = express.Router();

router.post(
  "/pharmacies",
  requireAuth,
  requireRole("admin"),
  createPharmacyRules,
  validate,
  PharmacyController.createPharmacy
);

router.put(
  "/pharmacies/:id",
  requireAuth,
  requireRole("admin"),
  updatePharmacyRules,
  validate,
  PharmacyController.updatePharmacy
);

router.get(
  "/pharmacies",
  requireAuth,
  requireRole("admin"),
  PharmacyController.listPharmacies
);

router.get(
  "/pharmacies/:id",
  requireAuth,
  requireRole("admin", "pharmacist"),
  getPharmacyRules,
  validate,
  PharmacyController.getPharmacy
);

router.post(
  "/pharmacies/:id/assign",
  requireAuth,
  requireRole("admin", "doctor", "receptionist"),
  assignPrescriptionRules,
  validate,
  PharmacyController.assignPrescription
);

router.get(
  "/pharmacies/:id/prescriptions",
  requireAuth,
  requireRole("pharmacist", "admin"),
  PharmacyController.listAssignedPrescriptions
);

router.patch(
  "/pharmacies/:id/prescriptions/:prescriptionId/status",
  requireAuth,
  requireRole("pharmacist", "admin"),
  updatePrescriptionStatusRules,
  validate,
  PharmacyController.updatePrescriptionStatus
);

module.exports = router;

