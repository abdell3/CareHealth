import { Router } from 'express';
import { body } from 'express-validator';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, setStatus } from '../app/Http/Controllers/UserController';
import { verifyToken, requireRoles } from '../app/Http/Middlewares/AuthMiddleware';

const router = Router();

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

router.use(verifyToken);
router.use(requireRoles('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUserValidation, createUser);
router.put('/:id', updateUserValidation, updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/status', statusValidation, setStatus);

export default router;
