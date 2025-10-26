const express = require("express");
const { body, param } = require("express-validator");
const PharmacyController = require("../app/Http/Controllers/PharmacyController");
const AuthMiddleware = require("../app/Http/Middlewares/AuthMiddleware");

const router = express.Router();

const createValidation = [
  body("name").notEmpty().withMessage("Pharmacy name required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("phone").notEmpty().withMessage("Phone number required"),
  body("address").notEmpty().withMessage("Address required"),
  body("latitude").optional().isFloat(),
  body("longitude").optional().isFloat(),
  body("licenseNumber").notEmpty().withMessage("License number required"),
  body("licenseExpiry").isISO8601().withMessage("Valid license expiry date required"),
  body("managerId").isMongoId().withMessage("Valid manager ID required"),
];

const updateValidation = [
  body("name").optional().notEmpty(),
  body("email").optional().isEmail(),
  body("phone").optional().notEmpty(),
  body("address").optional().notEmpty(),
  body("latitude").optional().isFloat(),
  body("longitude").optional().isFloat(),
  body("licenseExpiry").optional().isISO8601(),
];

const staffValidation = [body("staffId").isMongoId().withMessage("Valid staff ID required")];

router.use(AuthMiddleware.verifyToken);

router.post("/", AuthMiddleware.requireRoles("admin"), createValidation, PharmacyController.create);

router.get("/", PharmacyController.list);

router.get("/:id", param("id").isMongoId(), PharmacyController.get);

router.put( "/:id", AuthMiddleware.requireRoles("admin"), param("id").isMongoId(), updateValidation, PharmacyController.update,);

router.delete("/:id", AuthMiddleware.requireRoles("admin"), param("id").isMongoId(), PharmacyController.delete);

router.post( "/:id/staff/add", AuthMiddleware.requireRoles("admin", "pharmacist"), param("id").isMongoId(), staffValidation, PharmacyController.addStaff );

router.post( "/:id/staff/remove", AuthMiddleware.requireRoles("admin", "pharmacist"), param("id").isMongoId(), staffValidation, PharmacyController.removeStaff );

module.exports = router;
