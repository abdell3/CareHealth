const UserModel = require('../Models/User');

class UserRepository {
  async findByEmail(email) {
    const User = UserModel.getModel();
    return await User.findByEmail(email);
  }

  async findById(id) {
    const User = UserModel.getModel();
    return await User.findById(id).populate('role');
  }

  async findAll(filters = {}) {
    const User = UserModel.getModel();
    const query = {};
    
    if (filters.role) {
      query.role = filters.role;
    }
    
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    return await User.find(query).populate('role');
  }

  async create(userData) {
    const User = UserModel.getModel();
    const user = new User(userData);
    return await user.save();
  }

  async update(id, updateData) {
    const User = UserModel.getModel();
    return await User.findByIdAndUpdate(id, updateData, { new: true }).populate('role');
  }

  async delete(id) {
    const User = UserModel.getModel();
    return await User.findByIdAndDelete(id);
  }
}

module.exports = new UserRepository();
