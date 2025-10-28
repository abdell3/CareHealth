const express = require('express');
const { body } = require('express-validator');
const RoleController = require('../app/Http/Controllers/RoleController');
const AuthMiddleware = require('../app/Http/Middlewares/AuthMiddleware');

const router = express.Router();

router.use(AuthMiddleware.verifyToken);
router.use(AuthMiddleware.requireRoles('admin'));

router.get('/', RoleController.list);

router.post('/',
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 30 })
    .matches(/^[a-z0-9_-]+$/)
    .withMessage('Invalid role name'),
  body('displayName').notEmpty(),
  body('description').notEmpty(),
  RoleController.create
);

router.get('/:id', RoleController.getRoleById);


router.put('/:id',
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 30 })
    .matches(/^[a-z0-9_-]+$/),
  body('displayName').optional().notEmpty(),
  body('description').optional().notEmpty(),
  RoleController.update
);

router.delete('/:id', RoleController.remove);

module.exports = router;


