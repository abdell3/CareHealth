const BaseRepository = require("./BaseRepository");
const { MedicalDocument } = require("../models");

class MedicalDocumentRepository extends BaseRepository {
  constructor() {
    super(MedicalDocument);
  }

  async create(record) {
    return super.create(record);
  }

  async findById(id) {
    return super.findById(id);
  }

  async findByPatient(patientId, options = {}) {
    const filter = { patientId };
    return super.find(filter, options);
  }

  async deleteById(id) {
    return super.deleteById(id);
  }
}

module.exports = new MedicalDocumentRepository();

