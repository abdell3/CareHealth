const MedicalDocumentModel = require("./MedicalDocument");

class MedicalDocumentRepository {
  constructor() {
    this.App = MedicalDocumentModel.getModel();
  }

  async create(data) {
    const doc = new this.App(data);
    return doc.save();
  }

  async findById(id) {
    return this.App.findById(id)
      .populate("patient", "firstName lastName")
      .populate("uploadedBy", "firstName lastName email")
      .populate("medicalRecord");
  }

  async findByPatient(patientId, filters = {}) {
    const query = { patient: patientId };

    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.documentType) {
      query.documentType = filters.documentType;
    }
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    const page = Math.max(Number.parseInt(filters.page) || 1, 1);
    const limit = Math.min(Number.parseInt(filters.limit) || 50, 200);
    const skip = (page - 1) * limit;

    const docs = await this.App.find(query)
      .populate("uploadedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.App.countDocuments(query);
    return { data: docs, meta: { page, limit, total } };
  }

  async findByMedicalRecord(medicalRecordId) {
    return this.App.find({ medicalRecord: medicalRecordId })
      .populate("uploadedBy", "firstName lastName")
      .sort({ createdAt: -1 });
  }

  async update(id, data) {
    return this.App.findByIdAndUpdate(id, data, { new: true })
      .populate("patient", "firstName lastName")
      .populate("uploadedBy", "firstName lastName");
  }

  async logAccess(id, userId, action) {
    return this.App.findByIdAndUpdate(
      id,
      {
        $push: {
          accessLog: {
            userId,
            accessedAt: new Date(),
            action,
          },
        },
      },
      { new: true },
    );
  }

  async delete(id) {
    return this.App.findByIdAndDelete(id);
  }

  async deleteByS3Key(s3Key) {
    return this.App.deleteOne({ s3Key });
  }
}

module.exports = new MedicalDocumentRepository();
