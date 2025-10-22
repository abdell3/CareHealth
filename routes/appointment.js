const express = require('express');
const { body, query } = require('express-validator');
const AppointmentController = require('../app/Http/Controllers/AppointmentController');
const AuthMiddleware = require('../app/Http/Middlewares/AuthMiddleware');

const router = express.Router();

const createValidation = [
  body('doctorId').isMongoId().withMessage('Valid doctor ID required'),
  body('patientId').isMongoId().withMessage('Valid patient ID required'),
  body('startTime').isISO8601().withMessage('Valid start time required'),
  body('endTime').optional().isISO8601().withMessage('Valid end time format'),
  body('duration').optional().isInt({ min: 15, max: 120 }).withMessage('Duration must be between 15 and 120 minutes'),
  body('notes').optional().isString().trim()
];

const updateValidation = [
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
  body('duration').optional().isInt({ min: 15, max: 120 }),
  body('status').optional().isIn(['scheduled', 'completed', 'cancelled']),
  body('notes').optional().isString().trim()
];

const availabilityValidation = [
  query('doctorId').isMongoId().withMessage('Valid doctor ID required'),
  query('date').isISO8601().withMessage('Valid date required (format: YYYY-MM-DD)')
];

router.use(AuthMiddleware.verifyToken);

// Endpoint de disponibilités (AVANT /:id pour éviter les conflits de routing)
router.get('/availability', 
  availabilityValidation, 
  AppointmentController.checkAvailability
);

// CRUD Appointments
router.post('/', 
  AuthMiddleware.requireRoles('admin', 'doctor', 'nurse', 'secretary'), 
  createValidation, 
  AppointmentController.create
);

router.get('/', 
  AppointmentController.list
);

router.get('/:id', 
  AppointmentController.get
);

router.put('/:id', 
  AuthMiddleware.requireRoles('admin', 'doctor', 'nurse', 'secretary'), 
  updateValidation, 
  AppointmentController.update
);

router.delete('/:id', 
  AppointmentController.remove
);

module.exports = router;