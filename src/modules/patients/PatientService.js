const PatientRepository = require('./PatientRepository');

class PatientService {
  async create(data) {
    return PatientRepository.create(data);
  }

  async list(params) {
    return PatientRepository.findAll(params);
  }

  async get(id) {
    const doc = await PatientRepository.findById(id);
    if (!doc) throw new Error('Patient not found');
    return doc;
  }

  async update(id, data) {
    const doc = await PatientRepository.update(id, data);
    if (!doc) throw new Error('Patient not found');
    return doc;
  }

  async remove(id) {
    const doc = await PatientRepository.delete(id);
    if (!doc) throw new Error('Patient not found');
    return { deleted: true };
  }
}

module.exports = new PatientService();


