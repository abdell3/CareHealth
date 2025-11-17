const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const requireRole = require("../middlewares/requireRole");
const { validate } = require("../core/middlewares/validate");
const UserController = require("../controllers/UserController");
const {
  createUserRules,
  updateUserRules,
  changePasswordRules,
  setSuspendedRules,
} = require("../validators/userValidators");

const router = express.Router();

router.post(
  "/users",
  requireAuth,
  requireRole("admin"),
  createUserRules,
  UserController.createUser
);

router.get(
  "/users",
  requireAuth,
  requireRole("admin"),
  UserController.listUsers
);

router.get(
  "/users/:id",
  requireAuth,
  requireRole("admin", "doctor", "nurse", "pharmacist", "lab_manager", "patient"),
  (req, res, next) => {
    if (req.user.role === "patient" && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  },
  UserController.getUser
);

router.put(
  "/users/:id",
  requireAuth,
  requireRole("admin", "doctor", "nurse", "pharmacist", "lab_manager", "patient"),
  (req, res, next) => {
    if (req.user.role === "patient" && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  },
  updateUserRules,
  UserController.updateUser
);

router.patch(
  "/users/:id/suspend",
  requireAuth,
  requireRole("admin"),
  setSuspendedRules,
  UserController.setSuspended
);

router.post(
  "/users/:id/change-password",
  requireAuth,
  (req, res, next) => {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  },
  changePasswordRules,
  UserController.changePassword
);

module.exports = router;


