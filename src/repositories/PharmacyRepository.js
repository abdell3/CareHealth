const BaseRepository = require("./BaseRepository");
const { Pharmacy } = require("../models");

class PharmacyRepository extends BaseRepository {
  constructor() {
    super(Pharmacy);
  }

  async create(data) {
    return super.create(data);
  }

  async findById(id) {
    return super.findById(id);
  }

  async findByIdentifier(identifier) {
    return this.Model.findOne({ identifier });
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
}

module.exports = new PharmacyRepository();

