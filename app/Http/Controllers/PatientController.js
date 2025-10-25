const { body, validationResult } = require('express-validator');
const PatientService = require('../../Services/PatientService');

class PatientController {
  async create(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) 
      {
        return res.status(400).json({ success: false, errors: errors.array() });
      }    
    try {
      const doc = await PatientService.create(req.body);
      res.status(201).json({ success: true, data: doc });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async list(req, res) {
    try {
      const params = {
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit,
        gender: req.query.gender,
        dateOfBirth: req.query.dateOfBirth
      };
      const result = await PatientService.list(params);
      res.json({ 
        success: true, 
        data: result.data, 
        meta: result.meta 
      });
    } catch (e) {
      res.status(500).json({ 
        success: false, 
        message: e.message 
      });
    }
  }

  async get(req, res) {
    try {
      const doc = await PatientService.get(req.params.id);
      if (req.user.role && req.user.role.name === 'patient') {
        if (!doc.user || String(doc.user) !== String(req.user._id)) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }
      }
      res.json({ success: true, data: doc });
    } catch (e) {
      const code = e.message === 'Patient not found' ? 404 : 400;
      res.status(code).json({ success: false, message: e.message });
    }
  }

  async update(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    try {
      const doc = await PatientService.update(req.params.id, req.body);
      res.json({ success: true, data: doc });
    } catch (e) {
      const code = e.message === 'Patient not found' ? 404 : 400;
      res.status(code).json({ success: false, message: e.message });
    }
  }

  async remove(req, res) {
    try {
      const result = await PatientService.remove(req.params.id);
      res.json({ success: true, data: result });
    } catch (e) {
      const code = e.message === 'Patient not found' ? 404 : 400;
      res.status(code).json({ success: false, message: e.message });
    }
  }
}

module.exports = new PatientController();


