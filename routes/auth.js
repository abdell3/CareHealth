const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../src/modules/auth/AuthController');

const router = express.Router();

const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  
  body('role')
    .optional()
    .isIn(['admin', 'doctor', 'nurse', 'secretary', 'patient'])
    .withMessage('Invalid role'),
  
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const resetPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
];

const updatePasswordValidation = [
  body('resetToken')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
];

router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);
router.post('/refresh-token', AuthController.refresh);
router.post('/reset-password', resetPasswordValidation, AuthController.resetPassword);
router.post('/update-password', updatePasswordValidation, AuthController.updatePassword);
router.post('/logout', AuthController.logout);

module.exports = router;
