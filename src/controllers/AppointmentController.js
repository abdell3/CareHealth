const { validationResult } = require("express-validator");
const AppointmentService = require("../services/AppointmentService");
const { ConflictError } = require("../core/errors/ConflictError");
const { BadRequestError } = require("../core/errors/BadRequestError");
const { NotFoundError } = require("../core/errors/NotFoundError");
const { ServiceUnavailableError } = require("../core/errors/ServiceUnavailableError");

class AppointmentController {
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { patientId, doctorId, startAt, endAt, notes } = req.body;
      const createdBy = req.user ? req.user.id : null;

      const appointment = await AppointmentService.createAppointment({
        patientId,
        doctorId,
        startAt,
        endAt,
        createdBy,
        notes,
      });

      return res.status(201).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      if (error instanceof ConflictError) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
      if (error instanceof BadRequestError) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error instanceof ServiceUnavailableError) {
        return res.status(503).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const cancelledBy = req.user ? req.user.id : null;

      const appointment = await AppointmentService.cancelAppointment(id, cancelledBy);

      return res.status(200).json({
        success: true,
        data: appointment,
        message: "Appointment cancelled successfully",
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const filters = req.query;
      const appointments = await AppointmentService.listAppointments(filters);

      return res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AppointmentController();

