const UserRepository = require('../Repositories/UserRepository');
const RoleModel = require('../Models/Role');

class UserService {
  async getAllUsers() {
    return await UserRepository.findAll();
  }

  async getUserById(id) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async createUser(userData) {
    const Role = RoleModel.getModel();
    const role = await Role.findByName(userData.role);
    
    if (!role) {
      throw new Error('Role not found');
    }

    const user = await UserRepository.create({
      ...userData,
      role: role._id
    });

    return user;
  }

  async updateUser(id, updateData) {
    if (updateData.role) {
      const Role = RoleModel.getModel();
      const role = await Role.findByName(updateData.role);
      if (role) {
        updateData.role = role._id;
      }
    }

    return await UserRepository.update(id, updateData);
  }

  async deleteUser(id) {
    return await UserRepository.delete(id);
  }
}

module.exports = new UserService();
