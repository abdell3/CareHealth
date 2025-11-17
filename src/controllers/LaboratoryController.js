const { validationResult } = require("express-validator");
const LaboratoryService = require("../services/LaboratoryService");
const { BadRequestError } = require("../core/errors/BadRequestError");
const { NotFoundError } = require("../core/errors/NotFoundError");
const { ForbiddenError } = require("../core/errors/ForbiddenError");
const { ConflictError } = require("../core/errors/ConflictError");

function adaptRequester(user) {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    _id: user._id || user.id,
    roles: user.roles || (user.role ? [user.role] : []),
    role: user.role,
  };
}

class LaboratoryController {
  async createOrder(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { patientId, doctorId, consultationId, tests, notes } = req.body;
      const createdBy = req.user ? req.user.id : null;

      if (!createdBy) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const order = await LaboratoryService.createOrder({
        patientId,
        doctorId,
        consultationId,
        tests,
        notes,
        createdBy,
      });

      return res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error instanceof ConflictError) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async getOrder(req, res, next) {
    try {
      const { id } = req.params;
      const requester = adaptRequester(req.user);

      if (!requester) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const order = await LaboratoryService.getOrder(id, requester);

      return res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error instanceof ForbiddenError) {
        return res.status(403).json({
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
      next(error);
    }
  }

  async addResult(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id: orderId } = req.params;
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

      const result = await LaboratoryService.addResultToOrder({
        orderId,
        uploaderId,
        file: req.file,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        size: req.file.size,
      });

      return res.status(201).json({
        success: true,
        data: result,
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
      if (error instanceof ConflictError) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async getResultPresigned(req, res, next) {
    try {
      const { resultId } = req.params;
      const requester = adaptRequester(req.user);

      if (!requester) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const url = await LaboratoryService.getResultPresignedUrl(resultId, requester);

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
      if (error instanceof ForbiddenError) {
        return res.status(403).json({
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
      next(error);
    }
  }

  async validateResult(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id: resultId } = req.params;
      const validatorUserId = req.user ? req.user.id : null;
      const validatorRole = req.user ? req.user.role : null;

      if (!validatorUserId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!validatorRole) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Role required",
        });
      }

      const result = await LaboratoryService.validateResult(resultId, validatorUserId, validatorRole);

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
      if (error instanceof ForbiddenError) {
        return res.status(403).json({
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
      next(error);
    }
  }
}

module.exports = new LaboratoryController();

