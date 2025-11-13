const AppointmentRepository = require("../Repositories/AppointmentRepository");
const UserRepository = require("../Repositories/UserRepository");
const PatientRepository = require("../Repositories/PatientRepository");

class AppointmentService {
  async create({ doctorId, patientId, startTime, endTime, duration, notes }) {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + (duration || 30) * 60000);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const err = new Error("Invalid startTime or endTime");
      err.statusCode = 400;
      throw err;
    }
    if (start >= end) {
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

    const patient = (await PatientRepository.get)
      ? await PatientRepository.get(patientId)
      : await PatientRepository.findById(patientId);
    if (!patient) {
      const err = new Error("Patient not found");
      err.statusCode = 404;
      throw err;
    }

    const doctorConflicts = await AppointmentRepository.findByDoctorBetween(doctorId, start, end);
    if (doctorConflicts && doctorConflicts.length > 0) {
      const err = new Error("Appointment conflict for doctor");
      err.statusCode = 409;
      throw err;
    }

    const patientConflicts = await AppointmentRepository.findByPatientBetween(patientId, start, end);
    if (patientConflicts && patientConflicts.length > 0) {
      const err = new Error("Patient has another appointment at this time");
      err.statusCode = 409;
      throw err;
    }

    const created = await AppointmentRepository.create({
      doctor: doctorId,
      patient: patientId,
      startTime: start,
      endTime: end,
      duration,
      notes,
    })
    return created;
  }

  async list(filters) {
    return AppointmentRepository.list(filters);
  }

  async get(id) {
    const a = await AppointmentRepository.findById(id);
    if (!a) {
      const err = new Error("Appointment not found");
      err.statusCode = 404;
      throw err;
    }
    return a
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
}

module.exports = new AppointmentService();
