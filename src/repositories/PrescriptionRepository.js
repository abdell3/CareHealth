const BaseRepository = require("./BaseRepository");
const { Prescription } = require("../models");

class PrescriptionRepository extends BaseRepository {
  constructor() {
    super(Prescription);
  }

  async assignToPharmacy(prescriptionId, pharmacyId) {
    return this.Model.findByIdAndUpdate(
      prescriptionId,
      { pharmacy: pharmacyId },
      { new: true }
    );
  }

  async listByPharmacy(pharmacyId, filters = {}) {
    const query = { pharmacy: pharmacyId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.from || filters.to) {
      query.prescriptionDate = {};
      if (filters.from) {
        query.prescriptionDate.$gte = new Date(filters.from);
      }
      if (filters.to) {
        query.prescriptionDate.$lte = new Date(filters.to);
      }
    }

    const options = {
      sort: filters.sort || { prescriptionDate: -1 },
      limit: filters.limit,
      skip: filters.skip,
    };

    return super.find(query, options);
  }

  async updateStatus(prescriptionId, status) {
    const allowedStatuses = ["draft", "signed", "sent", "dispensed", "unavailable"];
    
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed values: ${allowedStatuses.join(", ")}`);
    }

    const update = { status };

    if (status === "signed") {
      update.signedAt = new Date();
    } else if (status === "sent") {
      update.sentAt = new Date();
    } else if (status === "dispensed") {
      update.dispensedAt = new Date();
    }

    return this.Model.findByIdAndUpdate(prescriptionId, update, { new: true });
  }
}

module.exports = new PrescriptionRepository();

