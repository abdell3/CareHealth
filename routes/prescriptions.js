const express = require('express');
const { body } = require('express-validator');
const PrescriptionController = require('../app/Http/Controllers/PrescriptionController');
const AuthMiddleware = require('../app/Http/Middlewares/AuthMiddleware');

const router = express.Router();
const createValidation = [
    body('patientId').isMongoId().withMessage('Valid Patient Id required'),
    body('medications').isArray({ min : 1 }).withMessage('At Least One Medication Required'),
    body('medications.*.name').isString().trim().notEmpty().withMessage('Medication Name required'),
    body('medications.*.dosage').isString().trim().notEmpty().withMessage('Dosage required'),
    body('medications.*.frequency').isString().trim().notEmpty().withMessage('Frequency required'),
    body('medications.*.duration').optional().isString().trim(),
    body('medications.*.instructions').optional().isString().trim(),
    body('expiryDate').optional().isISO8601(),
    body('notes').optional().isString().trim()
];

const updateValidation = [
    body('status').optional().isIn(['active', 'completed', 'cancelled']),
    body('medications').optional().isArray(),
    body('notes').optional().isString().trim()
];

router.use(AuthMiddleware.verifyToken);

router.post('/', AuthMiddleware.requireRoles('doctor'), createValidation, PrescriptionController.create);
router.get('/patient/:patientId', PrescriptionController.getPatientPrescriptions);
router.get('/doctor/prescriptions', AuthMiddleware.requireRoles('doctor'), PrescriptionController.getDoctorPrescriptions);
router.get('/:id', PrescriptionController.get);
router.put('/:id', AuthMiddleware.requireRoles('doctor'), updateValidation, PrescriptionController.update)
router.delete('/:id', AuthMiddleware.requireRoles('doctor'), PrescriptionController.delete);


module.exports = router;