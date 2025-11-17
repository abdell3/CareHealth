const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const requireRole = require("../middlewares/requireRole");
const ConsultationController = require("../controllers/ConsultationController");
const {
  createConsultationRules,
  updateConsultationRules,
  listConsultationsRules,
} = require("../validators/consultationValidators");

const router = express.Router();

router.post(
  "/consultations",
  requireAuth,
  requireRole("doctor", "nurse", "admin"),
  createConsultationRules,
  ConsultationController.createConsultation
);

router.get(
  "/consultations",
  requireAuth,
  requireRole("doctor", "admin"),
  listConsultationsRules,
  ConsultationController.listConsultations
);

router.get(
  "/consultations/:id",
  requireAuth,
  requireRole("doctor", "nurse", "admin", "patient"),
  ConsultationController.getConsultation
);

router.put(
  "/consultations/:id",
  requireAuth,
  requireRole("doctor", "admin"),
  updateConsultationRules,
  ConsultationController.updateConsultation
);

module.exports = router;
