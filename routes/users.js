const express = require('express');
const { body } = require('express-validator');
const UserController = require('../app/Http/Controllers/UserController');
const AuthMiddleware = require('../app/Http/Middlewares/AuthMiddleware');

const router = express.Router();

const createUserValidation = [
  body('firstName').notEmpty().withMessage('First name required'),
  body('lastName').notEmpty().withMessage('Last name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
  body('role').isIn(['admin', 'doctor', 'nurse', 'secretary', 'patient']).withMessage('Valid role required')
];

const updateUserValidation = [
  body('firstName').optional().notEmpty(),
  body('lastName').optional().notEmpty(),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['admin', 'doctor', 'nurse', 'secretary', 'patient'])
];

const statusValidation = [
  body('isActive').isBoolean().withMessage('isActive must be boolean')
];

router.use(AuthMiddleware.verifyToken);
router.use(AuthMiddleware.requireAdmin);

router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.post('/', createUserValidation, UserController.createUser);
router.put('/:id', updateUserValidation, UserController.updateUser);
router.delete('/:id', UserController.deleteUser);
router.patch('/:id/status', statusValidation, UserController.setStatus);

module.exports = router;
