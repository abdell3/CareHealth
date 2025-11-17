const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const requireRole = require("../middlewares/requireRole");
const { validate } = require("../core/middlewares/validate");
const AppointmentController = require("../controllers/AppointmentController");
const {
  createAppointmentRules,
} = require("../validators/appointmentValidators");

const router = express.Router();

router.post(
  "/appointments",
  requireAuth,
  requireRole("doctor", "nurse", "receptionist", "admin", "patient"),
  createAppointmentRules,
  validate,
  AppointmentController.create
);

router.get(
  "/appointments",
  requireAuth,
  AppointmentController.list
);

router.patch(
  "/appointments/:id/cancel",
  requireAuth,
  requireRole("doctor", "nurse", "receptionist", "admin", "patient"),
  AppointmentController.cancel
);

module.exports = router;

