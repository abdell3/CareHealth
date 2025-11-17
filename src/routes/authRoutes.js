const express = require("express");
const AuthController = require("../controllers/AuthController");
const { registerRules, loginRules, refreshRules } = require("../validators/authValidators");

const router = express.Router();

router.post("/register", registerRules, AuthController.register);
router.post("/login", loginRules, AuthController.login);
router.post("/refresh", refreshRules, AuthController.refresh);
router.post("/logout", refreshRules, AuthController.logout);

module.exports = router;


