const BaseRepository = require("./BaseRepository");
const { Consultation } = require("../models");

class ConsultationRepository extends BaseRepository {
  constructor() {
    super(Consultation);
  }

  async findByPatient(patientId, options = {}) {
    return this.find({ patientId }, options);
  }
}

module.exports = new ConsultationRepository();


