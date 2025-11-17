const { validationResult } = require("express-validator");
const PatientService = require("../services/PatientService");

function hasRole(req, roles) {
  return req.user && roles.includes(req.user.role);
}

function isSelfPatient(req, patientId) {
  return req.user && req.user.role === "patient" && req.user.id === patientId;
}

class PatientController {
  async createPatient(req, res) {
    if (!hasRole(req, ["admin", "receptionist", "nurse"])) {
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

    try {
      const createdBy = req.user && req.user.id;
      const patient = await PatientService.createPatient(req.body, createdBy);
      return res.status(201).json({ success: true, data: patient });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async getPatient(req, res) {
    const patientId = req.params.id;

    if (
      !hasRole(req, ["admin", "doctor", "nurse"]) &&
      !isSelfPatient(req, patientId)
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    try {
      const patient = await PatientService.getPatientById(patientId);
      return res.status(200).json({ success: true, data: patient });
    } catch (e) {
      if (e.message === "Patient not found") {
        return res.status(404).json({ success: false, message: e.message });
      }
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async listPatients(req, res) {
    if (!hasRole(req, ["admin", "receptionist", "doctor", "nurse"])) {
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

    const { name, page, limit } = req.query;

    const query = {};
    if (name) {
      query.name = name;
    }

    const options = {};
    if (page) {
      options.page = Number(page);
    }
    if (limit) {
      options.limit = Number(limit);
    }

    try {
      const patients = await PatientService.searchPatients(query, options);
      return res.status(200).json({ success: true, data: patients });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  async updatePatient(req, res) {
    const patientId = req.params.id;

    if (
      !hasRole(req, ["admin", "doctor", "nurse"]) &&
      !isSelfPatient(req, patientId)
    ) {
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

    try {
      const updated = await PatientService.updatePatient(patientId, req.body);
      return res.status(200).json({ success: true, data: updated });
    } catch (e) {
      if (e.message === "Patient not found") {
        return res.status(404).json({ success: false, message: e.message });
      }
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async deletePatient(req, res) {
    if (!hasRole(req, ["admin"])) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const patientId = req.params.id;

    try {
      await PatientService.deletePatient(patientId);
      return res.status(204).send();
    } catch (e) {
      if (e.message === "Patient not found") {
        return res.status(404).json({ success: false, message: e.message });
      }
      return res.status(400).json({ success: false, message: e.message });
    }
  }
}

module.exports = new PatientController();


