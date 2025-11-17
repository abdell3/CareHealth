const { validationResult } = require("express-validator");
const MedicalRecordService = require("./MedicalRecordService");

class MedicalRecordController {
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { patientId, appointmentId, recordType, diagnosis, symptoms, vitalSigns, treatment, notes } = req.body;
      const doctorId = req.user._id;

      const record = await MedicalRecordService.create({
        patientId,
        doctorId,
        appointmentId,
        recordType,
        diagnosis,
        symptoms,
        vitalSigns,
        treatment,
        notes,
      });

      res.status(201).json({
        success: true,
        message: "Medical record created successfully",
        data: record,
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getPatientRecords(req, res) {
    try {
      const { patientId } = req.params;
      const { recordType, from, to, page, limit } = req.query;

      const records = await MedicalRecordService.getByPatient(patientId, {
        recordType,
        from,
        to,
        page,
        limit,
      });

      res.json({
        success: true,
        data: records.data,
        meta: records.meta,
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getDoctorRecords(req, res) {
    try {
      const doctorId = req.user._id;
      const { from, to, page, limit } = req.query;

      const records = await MedicalRecordService.getByDoctor(doctorId, {
        from,
        to,
        page,
        limit,
      });

      res.json({
        success: true,
        data: records.data,
        meta: records.meta,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async get(req, res) {
    try {
      const { id } = req.params;
      const record = await MedicalRecordService.get(id);

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const record = await MedicalRecordService.update(id, req.body);

      res.json({
        success: true,
        message: "Medical record updated successfully",
        data: record,
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await MedicalRecordService.delete(id);

      res.json({
        success: true,
        message: "Medical record deleted successfully",
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new MedicalRecordController();
