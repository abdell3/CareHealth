const express = require('express');
const { body, param } = require('express-validator');
const PatientController = require('../src/modules/patients/PatientController');
const AuthMiddleware = require('../src/core/middlewares/AuthMiddleware');
const MedicalDocumentController = require('../src/modules/documents/MedicalDocumentController');

const router = express.Router();

router.use(AuthMiddleware.verifyToken);

router.get(
  '/:id/documents/:docId/presigned',
  param('id').isMongoId(),
  param('docId').isMongoId(),
  MedicalDocumentController.getPatientDocumentPresigned
);

router.use(AuthMiddleware.requireRoles('admin','doctor','nurse','secretary'));

const createValidation = [
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('dateOfBirth').notEmpty(),
  body('gender').isIn(['male','female','other'])
];

const updateValidation = [
  body('gender').optional().isIn(['male','female','other'])
];

router.get('/', PatientController.list);
router.get('/:id', PatientController.get);

router.post('/', createValidation, PatientController.create);
router.put('/:id', updateValidation, PatientController.update);
router.delete('/:id', PatientController.remove);

module.exports = router;


