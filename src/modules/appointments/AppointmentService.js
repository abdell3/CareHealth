const Redis = require("ioredis");
const { v4: uuidv4 } = require("uuid");
const AppointmentRepository = require("./AppointmentRepository");
const UserRepository = require("../users/UserRepository");
const PatientRepository = require("../patients/PatientRepository");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class AppointmentService {
  constructor() {
    this.lockTtl = Number(process.env.APPOINTMENT_LOCK_TTL_MS || 2000);
    this.lockAcquireTimeout = Number(process.env.APPOINTMENT_LOCK_TIMEOUT_MS || 2000);
    this.queueKey = process.env.APPOINTMENT_QUEUE_KEY || "queues:appointment-reminders";
    this.redis = this.createRedisClient();
  }

  createRedisClient() {
    if (process.env.NODE_ENV === "test") {
      return null;
    }
    if (!process.env.REDIS_HOST) {
      return null;
    }

    return new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT || 6379),
    });
  }

  setRedisClient(client) {
    this.redis = client;
  }

  async create({ doctorId, patientId, startTime, endTime, duration, notes }) {
    const start = new Date(startTime);
    const calculatedEnd = endTime ? new Date(endTime) : new Date(start.getTime() + (duration || 30) * 60000);

    if (isNaN(start.getTime()) || isNaN(calculatedEnd.getTime())) {
      const err = new Error("Invalid startTime or endTime");
      err.statusCode = 400;
      throw err;
    }
    if (start >= calculatedEnd) {
      const err = new Error("startTime must be before endTime");
      err.statusCode = 400;
      throw err;
    }

    const doctor = await UserRepository.findById(doctorId);
    if (!doctor) {
      const err = new Error("Doctor not found");
      err.statusCode = 404;
      throw err;
    }
    if (!doctor.role || doctor.role.name !== "doctor") {
      const err = new Error("User is not a doctor");
      err.statusCode = 400;
      throw err;
    }

    const patient = await PatientRepository.findById(patientId);
    if (!patient) {
      const err = new Error("Patient not found");
      err.statusCode = 404;
      throw err;
    }

    const lockKey = `locks:appointments:doctor:${doctorId}`;
    const lockValue = await this.acquireLock(lockKey);

    try {
      const doctorConflicts = await AppointmentRepository.findByDoctorBetween(doctorId, start, calculatedEnd);
      if (doctorConflicts && doctorConflicts.length > 0) {
        const err = new Error("Appointment conflict for doctor");
        err.statusCode = 409;
        throw err;
      }

      const patientConflicts = await AppointmentRepository.findByPatientBetween(patientId, start, calculatedEnd);
      if (patientConflicts && patientConflicts.length > 0) {
        const err = new Error("Patient has another appointment at this time");
        err.statusCode = 409;
        throw err;
      }

      const created = await AppointmentRepository.create({
        doctor: doctorId,
        patient: patientId,
        startTime: start,
        endTime: calculatedEnd,
        duration,
        notes,
      });

      await this.enqueueReminder(created);
      return created;
    } finally {
      await this.releaseLock(lockKey, lockValue);
    }
  }

  async list(filters) {
    return AppointmentRepository.list(filters);
  }

  async get(id) {
    const appointment = await AppointmentRepository.findById(id);
    if (!appointment) {
      const err = new Error("Appointment not found");
      err.statusCode = 404;
      throw err;
    }
    return appointment;
  }

  async update(id, data) {
    const appt = await AppointmentRepository.findById(id);
    if (!appt) {
      const err = new Error("Appointment not found");
      err.statusCode = 404;
      throw err;
    }

    if (data.startTime || data.endTime) {
      const start = data.startTime ? new Date(data.startTime) : appt.startTime;
      const end = data.endTime ? new Date(data.endTime) : appt.endTime;

      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        const err = new Error("Invalid start/end times");
        err.statusCode = 400;
        throw err;
      }

      const doctorConflicts = await AppointmentRepository.findByDoctorBetween(appt.doctor, start, end);
      const othersDoctor = doctorConflicts.filter((c) => c._id.toString() !== id.toString());
      if (othersDoctor.length > 0) {
        const err = new Error("Appointment conflict for doctor");
        err.statusCode = 409;
        throw err;
      }

      const patientConflicts = await AppointmentRepository.findByPatientBetween(appt.patient, start, end);
      const othersPatient = patientConflicts.filter((c) => c._id.toString() !== id.toString());
      if (othersPatient.length > 0) {
        const err = new Error("Patient has another appointment at this time");
        err.statusCode = 409;
        throw err;
      }
    }

    return AppointmentRepository.update(id, data);
  }

  async cancel(id, options = {}) {
    const updateData = {
      status: "cancelled",
      cancelledAt: new Date(),
    };
    if (options.cancelledBy) {
      updateData.cancelledBy = options.cancelledBy;
    }
    if (options.cancellationReason) {
      updateData.cancellationReason = options.cancellationReason;
    }
    return AppointmentRepository.update(id, updateData);
  }

  async enqueueReminder(appointment) {
    if (!this.redis) {
      const err = new Error("Redis is not configured for reminders");
      err.statusCode = 500;
      throw err;
    }

    const startTime = new Date(appointment.startTime);
    const sendAtMs = Math.max(startTime.getTime() - ONE_DAY_MS, Date.now());

    const job = {
      type: "appointmentReminder",
      appointmentId: appointment._id.toString(),
      sendAt: new Date(sendAtMs).toISOString(),
      attempts: 0,
    };

    await this.redis.lpush(this.queueKey, JSON.stringify(job));
  }

  async acquireLock(lockKey) {
    if (!this.redis) {
      const err = new Error("Redis is not configured for appointment locking");
      err.statusCode = 500;
      throw err;
    }

    const lockValue = uuidv4();
    const deadline = Date.now() + this.lockAcquireTimeout;

    while (Date.now() < deadline) {
      const acquired = await this.redis.set(lockKey, lockValue, "PX", this.lockTtl, "NX");
      if (acquired === "OK") {
        return lockValue;
      }
      await sleep(50);
    }

    const err = new Error("Unable to secure appointment lock");
    err.statusCode = 503;
    throw err;
  }

  async releaseLock(lockKey, lockValue) {
    if (!this.redis || !lockValue) {
      return;
    }

    const script =
      'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';
    await this.redis.eval(script, 1, lockKey, lockValue);
  }
}

module.exports = new AppointmentService();
