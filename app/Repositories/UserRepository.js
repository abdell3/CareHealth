const UserModel = require('../Models/User');

class UserRepository {
  constructor() {
    this.model = UserModel.getModel();
  }
  
  async findByEmail(email) {
    return await this.model.findByEmail(email).populate('role').select('+password');
  }

  async findById(id) {
    return await this.model .findById(id).populate('role');
  }

  async findAll(filters = {}) {
    const query = {};
    
    if (filters.role) {
      query.role = filters.role;
    }
    
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    return await this.model.find(query).populate('role');
  }

  async create(userData) {
    const user = new this.model(userData);
    await user.save();
    return await this.model.findById(user._id).populate('role');
  }

  async update(id, updateData) {
    await this.model.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true 
    });
    return await this.findById(id);
  }

  async updateStatus(id, isActive) {
    return await this.model.findByIdAndUpdate(
      id, 
      { isActive }, 
      { new: true }
    ).populate('role');
  }

  async delete(id) {
    return await this.model.findByIdAndDelete(id);
  }
}

module.exports = new UserRepository();
