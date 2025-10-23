const MedicalRecordModel = require("../Models/MedicalRecord");

class MedicalRecordRepository {
  constructor() {
    this.MedicalRecord = MedicalRecordModel.getModel();
  }

  async create(data) {
    const doc = new this.MedicalRecord(data);
    return doc.save();
  }

  async findById(id) {
    return this.MedicalRecord.findById(id)
      .populate("patient", "firstName lastName dateOfBirth")
      .populate("doctor", "firstName lastName email")
      .populate("appointment");
  }

  async findByPatient(patientId, filters = {}) {
    const query = { patient: patientId };

    if (filters.recordType) {
      query.recordType = filters.recordType;
    }
    if (filters.from || filters.to) {
      query.recordDate = {};
      if (filters.from) query.recordDate.$gte = new Date(filters.from);
      if (filters.to) query.recordDate.$lte = new Date(filters.to);
    }

    const page = Math.max(Number.parseInt(filters.page) || 1, 1);
    const limit = Math.min(Number.parseInt(filters.limit) || 50, 200);
    const skip = (page - 1) * limit;

    const docs = await this.MedicalRecord.find(query)
      .populate("doctor", "firstName lastName")
      .sort({ recordDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.MedicalRecord.countDocuments(query);
    return { 
        data: docs, 
        meta: { page, limit, total } 
    };
  }

  async findByDoctor(doctorId, filters = {}) {
    const query = { doctor: doctorId };

    if (filters.from || filters.to) {
      query.recordDate = {};
      if (filters.from) query.recordDate.$gte = new Date(filters.from);
      if (filters.to) query.recordDate.$lte = new Date(filters.to);
    }

    const page = Math.max(Number.parseInt(filters.page) || 1, 1);
    const limit = Math.min(Number.parseInt(filters.limit) || 50, 200);
    const skip = (page - 1) * limit;

    const docs = await this.MedicalRecord.find(query)
      .populate("patient", "firstName lastName")
      .sort({ recordDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.MedicalRecord.countDocuments(query);
    return { 
        data: docs, 
        meta: { page, limit, total } 
    };
  }

  async update(id, data) {
    return this.MedicalRecord.findByIdAndUpdate(id, data, { new: true })
      .populate("patient", "firstName lastName")
      .populate("doctor", "firstName lastName");
  }

  async delete(id) {
    return this.MedicalRecord.findByIdAndDelete(id);
  }
}

module.exports = new MedicalRecordRepository();
