const { validationResult } = require("express-validator");
const MedicalDocumentService = require("../services/MedicalDocumentService");
const MedicalDocumentRepository = require("../repositories/MedicalDocumentRepository");
const { BadRequestError } = require("../core/errors/BadRequestError");
const { NotFoundError } = require("../core/errors/NotFoundError");
const { AppError } = require("../core/errors/AppError");

function hasRole(user, role) {
  if (!user) {
    return false;
  }
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.includes(role);
  }
  if (user.role) {
    return user.role === role;
  }
  return false;
}

function canAccessPatientDocuments(patientId, requester) {
  if (!requester) {
    return false;
  }

  const requesterId = requester.id || requester._id?.toString();
  const targetPatientId = patientId?.toString();

  if (hasRole(requester, "admin")) {
    return true;
  }

  if (hasRole(requester, "doctor") || hasRole(requester, "nurse") || hasRole(requester, "lab_manager")) {
    return true;
  }

  if (hasRole(requester, "patient") && requesterId === targetPatientId) {
    return true;
  }

  return false;
}

class MedicalDocumentController {
  async uploadDocument(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id: patientId } = req.params;
      const uploaderId = req.user ? req.user.id : null;

      if (!uploaderId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file provided",
        });
      }

      if (hasRole(req.user, "patient") && req.user.id !== patientId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Patients can only upload documents for themselves",
        });
      }

      const file = {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        size: req.file.size,
        category: req.body.category,
        tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags]) : [],
      };

      const document = await MedicalDocumentService.uploadDocument({
        patientId,
        uploaderId,
        file,
      });

      return res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async getPresignedUrl(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { patientId, docId } = req.params;
      const requester = req.user;

      if (!requester) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!canAccessPatientDocuments(patientId, requester)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      const requesterForService = {
        _id: requester.id,
        id: requester.id,
        roles: requester.role ? [requester.role] : [],
        role: requester.role,
      };

      const url = await MedicalDocumentService.getDocumentPresignedUrl(docId, requesterForService);

      return res.status(200).json({
        success: true,
        data: { url },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async listDocuments(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { patientId } = req.params;
      const requester = req.user;

      if (!requester) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!canAccessPatientDocuments(patientId, requester)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      const documents = await MedicalDocumentRepository.findByPatient(patientId);

      return res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { docId } = req.params;
      const requester = req.user;

      if (!requester) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const requesterForService = {
        _id: requester.id,
        id: requester.id,
        roles: requester.role ? [requester.role] : [],
        role: requester.role,
      };

      const result = await MedicalDocumentService.deleteDocument(docId, requesterForService);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }
}

module.exports = new MedicalDocumentController();

