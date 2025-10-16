const express = require('express');
const { body } = require('express-validator');
const PatientController = require('../app/Http/Controllers/PatientController');
const AuthMiddleware = require('../app/Http/Middlewares/AuthMiddleware');

const router = express.Router();

router.use(AuthMiddleware.verifyToken);

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


