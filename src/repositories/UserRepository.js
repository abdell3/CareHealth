const { User } = require("../models");

async function create(data) {
  const user = new User(data);
  return user.save();
}

async function findById(id) {
  return User.findById(id);
}

async function findByEmail(email) {
  return User.findOne({ email });
}

async function find(filter = {}, options = {}) {
  const query = User.find(filter);

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

async function updateById(id, update) {
  return User.findByIdAndUpdate(id, update, { new: true });
}

async function setSuspended(id, suspended) {
  return User.findByIdAndUpdate(id, { suspended }, { new: true });
}

async function deleteById(id) {
  return User.findByIdAndDelete(id);
}

module.exports = {
  create,
  findById,
  findByEmail,
  find,
  updateById,
  setSuspended,
  deleteById,
};


