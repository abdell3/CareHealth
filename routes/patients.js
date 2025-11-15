const express = require('express');
const { body, param } = require('express-validator');
const PatientController = require('../app/Http/Controllers/PatientController');
const AuthMiddleware = require('../app/Http/Middlewares/AuthMiddleware');
const MedicalDocumentController = require('../app/Http/Controllers/MedicalDocumentController');

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


