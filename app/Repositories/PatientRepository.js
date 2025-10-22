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
      query.$or = [{ firstName: r }, { lastName: r }, { email: r }, { phone: r }];
    }
    if (params.gender) {
      query.gender = params.gender;
    }
    if (params.dateOfBirth) {
      query.dateOfBirth = new Date(params.dateOfBirth);
    }

    const page = Math.max(parseInt(params.page) || 1, 1);
    const limit = Math.min(parseInt(params.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const docs = await this.Patient.find(query)
      .sort({ lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email role');

    const total = await this.Patient.countDocuments(query);
    return { data: docs, meta: { page, limit, total } };
  }

  async update(id, data) {
    return this.Patient.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return this.Patient.findByIdAndDelete(id);
  }
}

module.exports = new PatientRepository();


