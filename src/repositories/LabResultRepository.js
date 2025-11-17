const BaseRepository = require("./BaseRepository");
const { LabResult } = require("../models");

class LabResultRepository extends BaseRepository {
  constructor() {
    super(LabResult);
  }

  async createResult(payload) {
    return this.create(payload);
  }

  async findById(id) {
    return super.findById(id);
  }

  async findByOrder(orderId) {
    return this.find({ orderId });
  }

  async listResults(filters = {}, options = {}) {
    return this.find(filters, options);
  }

  async updateResult(id, update) {
    return this.updateById(id, update);
  }

  async deleteResult(id) {
    return this.deleteById(id);
  }
}

module.exports = new LabResultRepository();

