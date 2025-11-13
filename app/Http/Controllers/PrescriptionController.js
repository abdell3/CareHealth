const { validationResult } = require('express-validator');
const PrescriptionService = require('../../Services/PrescriptionService');

class PrescriptionController {
    async create(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { patientId, medicalRecordId, medications, expiryDate, notes } = req.body
      const doctorId = req.user._id

      const prescription = await PrescriptionService.create({
        patientId,
        doctorId,
        medicalRecordId,
        medications,
        expiryDate,
        notes,
      })

      res.status(201).json({
        success: true,
        message: "Prescription created successfully",
        data: prescription,
      })
    } catch (error) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
      })
    }
  }

  async getPatientPrescriptions(req, res) {
    try {
      const { patientId } = req.params
      const { status, from, to, page, limit } = req.query

      const prescriptions = await PrescriptionService.getByPatient(patientId, {
        status,
        from,
        to,
        page,
        limit,
      })

      res.json({
        success: true,
        data: prescriptions.data,
        meta: prescriptions.meta,
      })
    } catch (error) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
      })
    }
  }

  async getDoctorPrescriptions(req, res) {
    try {
      const doctorId = req.user._id
      const { from, to, page, limit } = req.query

      const prescriptions = await PrescriptionService.getByDoctor(doctorId, {
        from,
        to,
        page,
        limit,
      })

      res.json({
        success: true,
        data: prescriptions.data,
        meta: prescriptions.meta,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }

  async get(req, res) {
    try {
      const { id } = req.params
      const prescription = await PrescriptionService.getById(id)

      res.json({
        success: true,
        data: prescription,
      })
    } catch (error) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
      })
    }
  }

  async update(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { id } = req.params
      const prescription = await PrescriptionService.update(id, req.body)

      res.json({
        success: true,
        message: "Prescription updated successfully",
        data: prescription,
      })
    } catch (error) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
      })
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params
      await PrescriptionService.delete(id)

      res.json({
        success: true,
        message: "Prescription deleted successfully",
      })
    } catch (error) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
      })
    }
  }
}

module.exports = new PrescriptionController();