const MedicalRecordRepository = require("../Repositories/MedicalRecordRepository");
const PatientRepository = require("../Repositories/PatientRepository");
const UserRepository = require("../Repositories/UserRepository");

class MedicalRecordService {
  async create({ patientId, doctorId, appointmentId, recordType, diagnosis, symptoms, vitalSigns, treatment, notes }) {
    const patient = await PatientRepository.findById(patientId);
    if (!patient) {
      const err = new Error("Patient not found");
      err.statusCode = 404;
      throw err;
    }

    const doctor = await UserRepository.findById(doctorId);
    if (!doctor || doctor.role.name !== "doctor") {
      const err = new Error("Doctor not found or invalid");
      err.statusCode = 404;
      throw err;
    }

    const record = await MedicalRecordRepository.create({
      patient: patientId,
      doctor: doctorId,
      appointment: appointmentId,
      recordType,
      diagnosis,
      symptoms,
      vitalSigns,
      treatment,
      notes,
    });

    return record;
  }

  async getByPatient(patientId, filters = {}) {
    return MedicalRecordRepository.findByPatient(patientId, filters);
  }

  async getByDoctor(doctorId, filters = {}) {
    return MedicalRecordRepository.findByDoctor(doctorId, filters);
  }

  async get(id) {
    const record = await MedicalRecordRepository.findById(id);
    if (!record) {
      const err = new Error("Medical record not found");
      err.statusCode = 404;
      throw err;
    }
    return record;
  }

  async update(id, data) {
    const record = await MedicalRecordRepository.findById(id);
    if (!record) {
      const err = new Error("Medical record not found");
      err.statusCode = 404;
      throw err;
    }
    return MedicalRecordRepository.update(id, data);
  }

  async delete(id) {
    const record = await MedicalRecordRepository.findById(id);
    if (!record) {
      const err = new Error("Medical record not found");
      err.statusCode = 404;
      throw err;
    }
    return MedicalRecordRepository.delete(id);
  }
}

module.exports = new MedicalRecordService();
