class BaseRepository {
  constructor(Model) {
    this.Model = Model;
  }

  async create(data) {
    const doc = new this.Model(data);
    return doc.save();
  }

  async findById(id) {
    return this.Model.findById(id);
  }

  async findOne(filter) {
    return this.Model.findOne(filter);
  }

  async find(filter = {}, options = {}) {
    const query = this.Model.find(filter);

    if (options.sort) {
      query.sort(options.sort);
    }
    if (typeof options.limit === "number") {
      query.limit(options.limit);
    }
    if (typeof options.skip === "number") {
      query.skip(options.skip);
    }

    return query;
  }

  async updateById(id, update) {
    return this.Model.findByIdAndUpdate(id, update, { new: true });
  }

  async deleteById(id) {
    return this.Model.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return this.Model.countDocuments(filter);
  }
}

module.exports = BaseRepository;


