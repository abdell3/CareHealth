const UserModel = require('../Models/User');

class UserRepository {
  constructor() {
    this.User = UserModel.getModel();
  }
  
  async findByEmail(email) {
    return await this.User.findByEmail(email).populate('role').select('+password');
  }

  async findById(id) {
    return await this.User .findById(id).populate('role');
  }

  async findAll(filters = {}) {
    const query = {};
    
    if (filters.role) {
      query.role = filters.role;
    }
    
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    return await this.User.find(query).populate('role');
  }

  async create(userData) {
    const user = new this.user(userData);
    await user.save();
    return await this.User.findById(user._id).populate('role');
  }

  async update(id, updateData) {
    await this.User.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true 
    });
    return await this.findById(id);
  }

  async updateStatus(id, isActive) {
    return await this.User.findByIdAndUpdate(
      id, 
      { isActive }, 
      { new: true }
    ).populate('role');
  }

  async delete(id) {
    return await this.User.findByIdAndDelete(id);
  }
}

module.exports = new UserRepository();
