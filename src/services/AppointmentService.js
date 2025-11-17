const AppointmentRepository = require("../repositories/AppointmentRepository");
const redisClient = require("../core/utils/redisClient");
const redlock = require("../core/utils/lock");
const { BadRequestError } = require("../core/errors/BadRequestError");
const { ConflictError } = require("../core/errors/ConflictError");
const { ServiceUnavailableError } = require("../core/errors/ServiceUnavailableError");
const { NotFoundError } = require("../core/errors/NotFoundError");

class AppointmentService {
  async createAppointment({ patientId, doctorId, startAt, endAt, createdBy, notes }) {
    // a) Validate startAt < endAt
    const start = new Date(startAt);
    const end = new Date(endAt);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError("Invalid date format. Dates must be valid ISO strings.");
    }

    if (start >= end) {
      throw new BadRequestError("startAt must be before endAt");
    }

    // b) Acquire lock
    const lockKey = `locks:appointments:doctor:${doctorId}`;
    const lockTtl = 2000; // ms
    let lock = null;

    try {
      lock = await redlock.lock(lockKey, lockTtl);
    } catch (error) {
      throw new ServiceUnavailableError("Failed to acquire lock. Please try again.");
    }

    try {
      // c) Check for overlapping appointments
      const overlapping = await AppointmentRepository.findOverlapping(doctorId, start, end);

      if (overlapping && overlapping.length > 0) {
        throw new ConflictError("Doctor has an overlapping appointment at this time");
      }

      // d) Create appointment
      const appointment = await AppointmentRepository.create({
        patientId,
        doctorId,
        startAt: start,
        endAt: end,
        createdBy,
        notes,
        status: "scheduled",
      });

      // e) Enqueue reminder job
      const sendAt = start.getTime() - 24 * 3600 * 1000; // 24 hours before startAt
      const reminderJob = {
        type: "appointmentReminder",
        appointmentId: appointment._id.toString(),
        patientId: patientId.toString(),
        doctorId: doctorId.toString(),
        sendAt: sendAt,
      };

      await redisClient.lpush("queue:appointments:reminders", JSON.stringify(reminderJob));

      return appointment;
    } finally {
      // f) Release lock
      if (lock) {
        try {
          await lock.unlock();
        } catch (error) {
          // Lock may have expired, ignore
        }
      }
    }
  }

  async cancelAppointment(id, cancelledBy) {
    const appointment = await AppointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundError("Appointment not found");
    }

    // Update status to cancelled
    const updated = await AppointmentRepository.updateById(id, {
      status: "cancelled",
    });

    // Optionally remove queued reminder (search and remove from queue)
    // This is a simplified approach - in production, you might want to mark jobs as cancelled
    // rather than removing them from the queue
    try {
      const queueKey = "queue:appointments:reminders";
      const items = await redisClient.lrange(queueKey, 0, -1);
      
      for (let i = 0; i < items.length; i++) {
        const job = JSON.parse(items[i]);
        if (job.appointmentId === id.toString()) {
          await redisClient.lrem(queueKey, 1, items[i]);
          break;
        }
      }
    } catch (error) {
      // If queue operation fails, log but don't fail the cancellation
      console.error("Failed to remove reminder from queue:", error);
    }

    return updated;
  }

  async listAppointments(filters = {}) {
    return AppointmentRepository.find(filters);
  }
}

module.exports = new AppointmentService();

