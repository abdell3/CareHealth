const RoleModel = require('./Role');

class RoleService {
  constructor() {
    this.Role = RoleModel.getModel();
  }

  async initializeRoles() {
    try {
      await this.Role.initializeDefaultRoles();
      console.log('Default roles initialized successfully');
    } catch (error) {
      console.error('Error initializing roles:', error);
      throw error;
    }
  }

  async getAllRoles() {
    try {
      return await this.Role.findActiveRoles();
    } catch (error) {
      throw new Error('Failed to fetch roles');
    }
  }

  async getRoleByName(name) {
    try {
      return await this.Role.findByName(name);
    } catch (error) {
      throw new Error('Failed to fetch role');
    }
  }

  async getRoleById(id) {
    try {
      return await this.Role.findById(id);
    } catch (error) {
      throw new Error('Failed to fetch role');
    }
  }

  async createRole(roleData) {
    try {
      const role = new this.Role(roleData);
      await role.save();
      return role;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Role with this name already exists');
      }
      throw new Error('Failed to create role');
    }
  }

  async updateRole(id, updateData) {
    try {
      const role = await this.Role.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!role) {
        throw new Error('Role not found');
      }
      
      return role;
    } catch (error) {
      throw new Error('Failed to update role');
    }
  }

  async deleteRole(id) {
    try {
      const role = await this.Role.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );
      
      if (!role) {
        throw new Error('Role not found');
      }
      
      return role;
    } catch (error) {
      throw new Error('Failed to delete role');
    }
  }

  async checkPermission(roleId, resource, action) {
    try {
      const role = await this.Role.findById(roleId);
      
      if (!role || !role.isActive) {
        return false;
      }
      
      const permissions = role.permissions[resource];
      if (!permissions) {
        return false;
      }
      
      return permissions[action] === true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new RoleService();
