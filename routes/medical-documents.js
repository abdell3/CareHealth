const express = require("express");
const { body, param, query } = require("express-validator");
const multer = require("multer");
const MedicalDocumentController = require("../app/Http/Controllers/MedicalDocumentController");
const AuthMiddleware = require("../app/Http/Middlewares/AuthMiddleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "text/csv"]
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type. Only PDF, JPEG, PNG, and CSV allowed"))
    }
  },
});

const uploadValidation = [
  body("patientId").isMongoId().withMessage("Valid patient ID required"),
  body("category")
    .isIn(["imaging", "report", "lab_result", "prescription", "other"])
    .withMessage("Valid category required"),
  body("description").optional().isString().trim(),
  body("tags").optional().isArray(),
];

const searchValidation = [
  query("category").optional().isIn(["imaging", "report", "lab_result", "prescription", "other"]),
  query("tags").optional().isString(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

router.use(AuthMiddleware.verifyToken);

router.post("/upload", AuthMiddleware.requireRoles("admin", "doctor", "nurse"), upload.single("file"), uploadValidation,MedicalDocumentController.upload);

router.get("/patient/:patientId", param("patientId").isMongoId(), MedicalDocumentController.getPatientDocuments);

router.get("/:id", param("id").isMongoId(), MedicalDocumentController.get);

router.get("/:id/download", param("id").isMongoId(), MedicalDocumentController.getPresignedUrl);

router.delete("/:id", param("id").isMongoId(), MedicalDocumentController.delete);

router.get("/patient/:patientId/search", param("patientId").isMongoId(), searchValidation, MedicalDocumentController.search);

module.exports = router;
