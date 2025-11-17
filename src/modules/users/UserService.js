const UserRepository = require('./UserRepository');
const RoleModel = require('./Role');

class UserService {
  async getAllUsers(filters = {}) {
    const roleName = filters.role;
    let repoFilters = {};
    if (roleName) {
      const Role = RoleModel.getModel();
      const roleDoc = await Role.findByName(roleName);
      if (roleDoc) {
        repoFilters.role = roleDoc._id;
      } else {
        return [];
      }
    }
    return await UserRepository.findAll(repoFilters);
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

  async setUserStatus(id, isActive) {
    const updated = await UserRepository.updateStatus(id, isActive);
    if (!updated) {
      throw new Error('User not found');
    }
    return updated;
  }
}

module.exports = new UserService();
