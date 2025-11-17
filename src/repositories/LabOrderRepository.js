const BaseRepository = require("./BaseRepository");
const { LabOrder } = require("../models");

class LabOrderRepository extends BaseRepository {
  constructor() {
    super(LabOrder);
  }

  async createOrder(payload) {
    return this.create(payload);
  }

  async findById(id) {
    return super.findById(id);
  }

  async findByPatient(patientId, options = {}) {
    return this.find({ patientId }, options);
  }

  async findOrders(filters = {}, options = {}) {
    return this.find(filters, options);
  }

  async updateStatus(orderId, status) {
    return this.updateById(orderId, { status });
  }

  async addTest(orderId, testObject) {
    return this.Model.findByIdAndUpdate(
      orderId,
      { $push: { tests: testObject } },
      { new: true }
    );
  }
}

module.exports = new LabOrderRepository();


