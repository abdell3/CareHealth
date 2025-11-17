const { validationResult } = require('express-validator');
const AppointmentService = require('./AppointmentService');

class AppointmentController {
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { doctorId, patientId, startTime, endTime, duration, notes } = req.body;

      const appointment = await AppointmentService.create({
        doctorId,
        patientId,
        startTime,
        endTime,
        duration,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: appointment
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async list(req, res) {
    try {
      const { doctorId, patientId, status, date, startDate, endDate } = req.query;
      
      const filters = {};
      if (doctorId) filters.doctor = doctorId;
      if (patientId) filters.patient = patientId;
      if (status) filters.status = status;
      
      if (date) {
        const targetDate = new Date(date);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        filters.startTime = {
          $gte: targetDate,
          $lt: nextDay
        };
      }
      
      if (startDate && endDate) {
        filters.startTime = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const appointments = await AppointmentService.list(filters);

      res.json({
        success: true,
        count: appointments.length,
        data: appointments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async get(req, res) {
    try {
      const { id } = req.params;
      const appointment = await AppointmentService.get(id);

      res.json({
        success: true,
        data: appointment
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const appointment = await AppointmentService.update(id, updateData);

      res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: appointment
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async remove(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const appointment = await AppointmentService.cancel(id, {
        cancelledBy: req.user._id,
        cancellationReason: reason
      });

      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: appointment
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async checkAvailability(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { doctorId, date } = req.query;

      const workingHours = {
        start: '09:00',
        end: '17:00'
      };

      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const appointments = await AppointmentService.list({
        doctor: doctorId,
        startTime: {
          $gte: targetDate,
          $lt: nextDay
        },
        status: { $ne: 'cancelled' }
      });

      const availableSlots = [];
      const bookedSlots = [];
      
      appointments.forEach(apt => {
        const start = new Date(apt.startTime);
        const end = new Date(apt.endTime);
        
        bookedSlots.push({
          start: start.toISOString(),
          end: end.toISOString(),
          appointmentId: apt._id
        });
      });

      const [startHour, startMin] = workingHours.start.split(':').map(Number);
      const [endHour, endMin] = workingHours.end.split(':').map(Number);
      
      const dayStart = new Date(targetDate);
      dayStart.setHours(startHour, startMin, 0, 0);
      
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(endHour, endMin, 0, 0);

      let currentSlot = new Date(dayStart);
      const slotDuration = 30;

      while (currentSlot < dayEnd) {
        const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60000);
        
        const isBooked = bookedSlots.some(booked => {
          const bookedStart = new Date(booked.start);
          const bookedEnd = new Date(booked.end);
          
          return (
            (currentSlot >= bookedStart && currentSlot < bookedEnd) ||
            (slotEnd > bookedStart && slotEnd <= bookedEnd) ||
            (currentSlot <= bookedStart && slotEnd >= bookedEnd)
          );
        });

        if (!isBooked) {
          availableSlots.push({
            start: currentSlot.toISOString(),
            end: slotEnd.toISOString(),
            duration: slotDuration
          });
        }

        currentSlot = slotEnd;
      }

      res.json({
        success: true,
        data: {
          date: date,
          doctorId: doctorId,
          workingHours,
          availableSlots,
          bookedSlots,
          totalAvailable: availableSlots.length,
          totalBooked: bookedSlots.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AppointmentController();