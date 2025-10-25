const express = require('express');
const { body } = require('express-validator');
const PrescriptionController = require('../app/Http/Controllers/PrescriptionController');
const AuthMiddleware = require('../app/Http/Middlewares/AuthMiddleware');

const router = express.Router();
const createValidation = [
    body('patientId').isMongoId().withMessage('Valid Patient Id required'),
    body('medication').isArrat({ min : 1 }).withMessage('At Least One Medication Required'),
    body('medication.*.name').isString().trim().noEmpty().withMessage('Medication Name required'),
    body('medication.*.dosage').isString().trim().noEmpty().withMessage('Dosage required'),
    body('medication.*.frequency').isString().trim().noEmpty().withMessage('Frequency required'),
    body('medication.*.duration').optional().isString().trim(),
    body('medication.*.instructions').optional().isString().trim(),
    body('expiryDate').optional().isIS08601(),
    body('notes').optional().isString().trim()
];

const updateValidation = [
    body('status').optional().isIn(['active', 'completed', 'cancelled']),
    body('medication').optional().isArray(),
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