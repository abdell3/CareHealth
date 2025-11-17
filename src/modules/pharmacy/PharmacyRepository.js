const PharmacyModel = require('./Pharmacy');

class PharmacyRepository {
  constructor() {
    this.Pharmacy = PharmacyModel.getModel();
  }

  async create(data) {
    const doc = new this.Pharmacy(data);
    return doc.save();
  }

  async findById(id) {
    return this.Pharmacy.findById(id)
      .populate('manager', 'firstName lastName')
      .populate('staff', 'firstName lastName');
  }

  async findAll(filters = {}) {
    const query = { isActive: true };
    if (filters.isVerified !== undefined) {
      query.isVerified = filters.isVerified;
    }

    const page = Math.max(Number.parseInt(filters.page) || 1, 1);
    const limit = Math.min(Number.parseInt(filters.limit) || 50, 200);
    const skip = (page - 1) * limit;

    const docs = await this.Pharmacy.find(query)
      .populate('manager', 'firstName lastName')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await this.Pharmacy.countDocuments(query);
    return {
      data: docs,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findByEmail(email) {
    return this.Pharmacy.findOne({ email: email.toLowerCase() });
  }

  async findByLicenseNumber(licenseNumber) {
    return this.Pharmacy.findOne({ licenseNumber });
  }

  async update(id, data) {
    return this.Pharmacy.findByIdAndUpdate(id, data, { new: true })
      .populate('manager', 'firstName lastName')
      .populate('staff', 'firstName lastName');
  }

  async addStaff(pharmacyId, userId) {
    return this.Pharmacy.findByIdAndUpdate(
      pharmacyId,
      { $addToSet: { staff: userId } },
      { new: true },
    ).populate('staff', 'firstName lastName');
  }

  async removeStaff(pharmacyId, userId) {
    return this.Pharmacy.findByIdAndUpdate(
      pharmacyId,
      { $pull: { staff: userId } },
      { new: true },
    ).populate('staff', 'firstName lastName');
  }

  async delete(id) {
    return this.Pharmacy.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
}

module.exports = new PharmacyRepository();