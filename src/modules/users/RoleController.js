const { body, validationResult } = require('express-validator');
const RoleService = require('./RoleService');

class RoleController {
  async getRoleById(req, res) {
    try {
      const role = await RoleService.getRoleById(req.params.id);
      res.json({ success: true, data: role});
    } catch(error) {
      res.status(500).json({ success: false, message: error.message});
    }
  }



  async list(req, res) {
    try {
      const roles = await RoleService.getAllRoles();
      res.json({ success: true, data: roles });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const role = await RoleService.createRole(req.body);
      res.status(201).json({ success: true, data: role });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const role = await RoleService.updateRole(req.params.id, req.body);
      res.json({ success: true, data: role });
    } catch (e) {
      const code = e.message === 'Role not found' ? 404 : 400;
      res.status(code).json({ success: false, message: e.message });
    }
  }

  async remove(req, res) {
    try {
      const role = await RoleService.deleteRole(req.params.id);
      res.json({ success: true, data: role });
    } catch (e) {
      const code = e.message === 'Role not found' ? 404 : 400;
      res.status(code).json({ success: false, message: e.message });
    }
  }
}

module.exports = new RoleController();


