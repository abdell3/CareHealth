const { validationResult } = require("express-validator");
const PharmacyService = require("../services/PharmacyService");
const PharmacyRepository = require("../repositories/PharmacyRepository");
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

class PharmacyController {
  async createPharmacy(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const pharmacy = await PharmacyService.createPharmacy(req.body);

      return res.status(201).json({
        success: true,
        data: pharmacy,
      });
    } catch (error) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({
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

  async updatePharmacy(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const pharmacy = await PharmacyService.updatePharmacy(id, req.body);

      return res.status(200).json({
        success: true,
        data: pharmacy,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error instanceof BadRequestError) {
        return res.status(400).json({
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

  async getPharmacy(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const pharmacy = await PharmacyRepository.findById(id);

      if (!pharmacy) {
        return res.status(404).json({
          success: false,
          message: "Pharmacy not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: pharmacy,
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

  async listPharmacies(req, res, next) {
    try {
      const filters = req.query;
      const pharmacies = await PharmacyRepository.find(filters);

      return res.status(200).json({
        success: true,
        data: pharmacies,
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

  async assignPrescription(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { prescriptionId } = req.body;
      const pharmacyId = req.params.id;
      const assignedBy = req.user ? req.user.id : null;

      if (!assignedBy) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const prescription = await PharmacyService.assignPrescriptionToPharmacy(
        prescriptionId,
        pharmacyId,
        assignedBy
      );

      return res.status(200).json({
        success: true,
        data: prescription,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error instanceof BadRequestError) {
        return res.status(400).json({
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

  async listAssignedPrescriptions(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      let pharmacyId = req.params.pharmacyId || req.params.id;

      if (!pharmacyId) {
        return res.status(400).json({
          success: false,
          message: "pharmacyId is required",
        });
      }

      const filters = req.query;
      const prescriptions = await PharmacyService.listPrescriptionsForPharmacy(pharmacyId, filters);

      return res.status(200).json({
        success: true,
        data: prescriptions,
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

  async updatePrescriptionStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { prescriptionId } = req.params;
      const { status } = req.body;
      const updatedBy = req.user ? req.user : null;

      if (!updatedBy) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const prescription = await PharmacyService.updatePrescriptionStatus(
        prescriptionId,
        status,
        updatedBy
      );

      return res.status(200).json({
        success: true,
        data: prescription,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error instanceof BadRequestError) {
        return res.status(400).json({
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

module.exports = new PharmacyController();

