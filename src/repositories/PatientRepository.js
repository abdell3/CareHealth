const { Patient } = require("../models");

async function create(data) {
  const patient = new Patient(data);
  return patient.save();
}

async function findById(id) {
  return Patient.findById(id);
}

async function find(filter = {}, options = {}) {
  const query = Patient.find(filter);

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

async function searchByName(name, options = {}) {
  const regex = new RegExp(name, "i");
  const filter = {
    $or: [{ firstName: regex }, { lastName: regex }],
  };
  return find(filter, options);
}

async function updateById(id, update) {
  return Patient.findByIdAndUpdate(id, update, { new: true });
}

async function deleteById(id) {
  return Patient.findByIdAndDelete(id);
}

module.exports = {
  create,
  findById,
  find,
  searchByName,
  updateById,
  deleteById,
};


