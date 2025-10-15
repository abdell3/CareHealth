const express = require('express');
const { body } = require('express-validator');
const RoleController = require('../app/Http/Controllers/RoleController');
const AuthMiddleware = require('../app/Http/Middlewares/AuthMiddleware');

const router = express.Router();

router.use(AuthMiddleware.verifyToken);
router.use(AuthMiddleware.requireAdmin);

router.get('/', RoleController.list);

router.post('/',
  body('name').isIn(['admin','doctor','nurse','secretary','patient']).withMessage('Invalid role name'),
  body('displayName').notEmpty(),
  body('description').notEmpty(),
  RoleController.create
);

router.put('/:id',
  body('displayName').optional().notEmpty(),
  body('description').optional().notEmpty(),
  RoleController.update
);

router.delete('/:id', RoleController.remove);

module.exports = router;


