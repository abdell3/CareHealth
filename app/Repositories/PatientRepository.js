const PatientModel = require('../Models/Patient');

class PatientRepository {
  constructor() {
    this.Patient = PatientModel.getModel();
  }

  async create(data) {
    const doc = new this.Patient(data);
    return doc.save();
  }

  async findById(id) {
    return this.Patient.findById(id).populate('user');
  }

  async findAll(params = {}) {
    const query = {};
    if (params.search) {
      const r = new RegExp(params.search, 'i');
      query.$or = [ { firstName: r }, { lastName: r }, { email: r }, { phone: r } ];
    }
    return this.Patient.find(query).sort({ lastName: 1, firstName: 1 });
  }

  async update(id, data) {
    return this.Patient.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return this.Patient.findByIdAndDelete(id);
  }
}

module.exports = new PatientRepository();


