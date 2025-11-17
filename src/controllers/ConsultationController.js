const { validationResult } = require("express-validator");
const ConsultationService = require("../services/ConsultationService");
const { Appointment } = require("../models");

function hasRole(req, roles) {
  return req.user && roles.includes(req.user.role);
}

function isSelfPatient(req, patientId) {
  return req.user && req.user.role === "patient" && req.user.id === patientId.toString();
}

class ConsultationController {
  async createConsultation(req, res) {
    if (!hasRole(req, ["doctor", "nurse", "admin"])) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const payload = { ...req.body };
    const createdBy = req.user && req.user.id;

    if (payload.appointmentId) {
      const appointment = await Appointment.findById(payload.appointmentId);
      if (!appointment) {
        return res.status(404).json({ success: false, message: "Appointment not found" });
      }
    }

    try {
      const consultation = await ConsultationService.createConsultation(payload, createdBy);
      return res.status(201).json({ success: true, data: consultation });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async getConsultation(req, res) {
    const id = req.params.id;

    try {
      const consultation = await ConsultationService.getConsultationById(id);
      const patientId = consultation.patientId ? consultation.patientId.toString() : null;

      if (
        !hasRole(req, ["doctor", "nurse", "admin"]) &&
        !(patientId && isSelfPatient(req, patientId))
      ) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      return res.status(200).json({ success: true, data: consultation });
    } catch (e) {
      if (e.message === "Consultation not found") {
        return res.status(404).json({ success: false, message: e.message });
      }
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async listConsultations(req, res) {
    if (!hasRole(req, ["doctor", "admin"])) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { patientId } = req.query;

    try {
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: "patientId query param is required",
        });
      }
      const consultations = await ConsultationService.listByPatient(patientId);
      return res.status(200).json({ success: true, data: consultations });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async updateConsultation(req, res) {
    if (!hasRole(req, ["doctor", "admin"])) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const id = req.params.id;

    try {
      const updated = await ConsultationService.updateConsultation(id, req.body);
      return res.status(200).json({ success: true, data: updated });
    } catch (e) {
      if (e.message === "Consultation not found") {
        return res.status(404).json({ success: false, message: e.message });
      }
      return res.status(400).json({ success: false, message: e.message });
    }
  }
}

module.exports = new ConsultationController();

