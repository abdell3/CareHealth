const BaseRepository = require("./BaseRepository");
const { Appointment } = require("../models");

class AppointmentRepository extends BaseRepository {
  constructor() {
    super(Appointment);
  }

  async create(payload) {
    return super.create(payload);
  }

  async findById(id) {
    return super.findById(id);
  }

  async find(filter = {}, options = {}) {
    return super.find(filter, options);
  }

  async updateById(id, update) {
    return super.updateById(id, update);
  }

  async deleteById(id) {
    return super.deleteById(id);
  }

  async findOverlapping(doctorId, startAt, endAt) {
    return this.Model.find({
      doctorId,
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    });
  }
}

module.exports = new AppointmentRepository();

