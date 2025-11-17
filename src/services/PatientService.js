const PatientRepository = require("../repositories/PatientRepository");

class PatientService {
  async createPatient(payload, createdBy) {
    const data = {
      ...payload,
      createdBy,
    };
    return PatientRepository.create(data);
  }

  async getPatientById(id) {
    const patient = await PatientRepository.findById(id);
    if (!patient) {
      throw new Error("Patient not found");
    }
    return patient;
  }

  async updatePatient(id, payload) {
    const updated = await PatientRepository.updateById(id, payload);
    if (!updated) {
      throw new Error("Patient not found");
    }
    return updated;
  }

  async searchPatients(query, options = {}) {
    if (query && query.name) {
      return PatientRepository.searchByName(query.name, options);
    }
    return PatientRepository.find(query || {}, options);
  }

  async deletePatient(id) {
    const deleted = await PatientRepository.deleteById(id);
    if (!deleted) {
      throw new Error("Patient not found");
    }
    return deleted;
  }
}

module.exports = new PatientService();


