const express = require('express');
const { body } = require('express-validator');
const LabResultController = require('../src/modules/lab/results/LabResultController');
const AuthMiddleware = require('../src/core/middlewares/AuthMiddleware');

const router = express.Router();

const createValidation = [
    body('patientId').isMongoId().withMessage('Valid Patient ID Required'),
    body('testName').isString().trim().notEmpty().withMessage('Test Name Required'),
    body('testType').isIn(['blood', 'urine', 'imaging', 'other']).withMessage('Valid Test Type Required'),
    body('resultDate').optional().isISO8601(),
    body('results').optional().isObject(),
    body('notes').optional().isString().trim(),
    body('attachements').optional().isArray()
];

const updateValidation = [
    body('status').optional().isIn(['pending', 'completed', 'cancelled']),
    body('resultDate').optional().isISO8601(),
    body('results').optional().isObject(),
    body('notes').optional().isString().trim()
];

router.use(AuthMiddleware.verifyToken);

router.post('/', AuthMiddleware.requireRoles('doctor'), createValidation, LabResultController.create);
router.get('/patient/:patientId', LabResultController.getPatientResults);
router.get('/doctor/results', AuthMiddleware.requireRoles('doctor'), LabResultController.getDoctorResult);
router.get('/:id', LabResultController.get);
router.put('/:id', AuthMiddleware.requireRoles('doctor'), updateValidation, LabResultController.update);
router.delete('/:id', AuthMiddleware.requireRoles('doctor'), LabResultController.delete);

module.exports = router;