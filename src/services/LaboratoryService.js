const LabOrderRepository = require("../repositories/LabOrderRepository");
const LabResultRepository = require("../repositories/LabResultRepository");
const S3Service = require("./S3Service");
const { User } = require("../models");
const { BadRequestError } = require("../core/errors/BadRequestError");
const { NotFoundError } = require("../core/errors/NotFoundError");
const { ForbiddenError } = require("../core/errors/ForbiddenError");
const { ConflictError } = require("../core/errors/ConflictError");
const crypto = require("crypto");

const ALLOWED_RESULT_MIME_TYPES = ["application/pdf", "text/csv", "application/vnd.ms-excel"];

function hasRole(user, role) {
  if (!user || !user.roles) {
    return false;
  }
  return Array.isArray(user.roles) ? user.roles.includes(role) : user.roles === role;
}

function generateS3Key(orderId, originalName) {
  const timestamp = Date.now();
  const random8 = crypto.randomBytes(4).toString("hex");
  const sanitizedFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `lab-results/${orderId}/${timestamp}-${random8}-${sanitizedFileName}`;
}

function canAccessOrder(order, requester) {
  if (!order || !requester) {
    return false;
  }

  const requesterId = requester._id ? requester._id.toString() : requester.id?.toString();
  const orderDoctorId = order.doctorId ? order.doctorId.toString() : null;
  const orderPatientId = order.patientId ? order.patientId.toString() : null;

  if (hasRole(requester, "admin")) {
    return true;
  }

  if (hasRole(requester, "lab_manager")) {
    return true;
  }

  if (orderDoctorId && requesterId === orderDoctorId) {
    return true;
  }

  if (orderPatientId && requesterId === orderPatientId) {
    return true;
  }

  return false;
}

function canAccessResult(result, order, requester) {
  if (!result || !order || !requester) {
    return false;
  }

  const requesterId = requester._id ? requester._id.toString() : requester.id?.toString();
  const orderDoctorId = order.doctorId ? order.doctorId.toString() : null;
  const orderPatientId = order.patientId ? order.patientId.toString() : null;

  if (hasRole(requester, "admin")) {
    return true;
  }

  if (hasRole(requester, "lab_manager")) {
    return true;
  }

  if (orderDoctorId && requesterId === orderDoctorId) {
    return true;
  }

  if (orderPatientId && requesterId === orderPatientId) {
    return true;
  }

  return false;
}

class LaboratoryService {
  async createOrder({ patientId, doctorId, consultationId, tests, notes, createdBy }) {
    if (!patientId) {
      throw new BadRequestError("patientId is required");
    }

    if (!doctorId) {
      throw new BadRequestError("doctorId is required");
    }

    if (!tests || !Array.isArray(tests) || tests.length === 0) {
      throw new BadRequestError("tests array is required and must not be empty");
    }

    if (!createdBy) {
      throw new BadRequestError("createdBy is required");
    }

    const payload = {
      patientId,
      doctorId,
      consultationId: consultationId || undefined,
      tests,
      notes: notes || undefined,
      status: "ordered",
      requestedAt: new Date(),
      createdBy,
    };

    return LabOrderRepository.createOrder(payload);
  }

  async getOrder(orderId, requester) {
    if (!orderId) {
      throw new BadRequestError("orderId is required");
    }

    if (!requester) {
      throw new BadRequestError("requester is required");
    }

    const order = await LabOrderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Lab order not found");
    }

    if (!canAccessOrder(order, requester)) {
      throw new ForbiddenError("Access denied to this lab order");
    }

    return order;
  }

  async addResultToOrder({ orderId, uploaderId, file, mimeType, originalName, size }) {
    if (!orderId) {
      throw new BadRequestError("orderId is required");
    }

    if (!uploaderId) {
      throw new BadRequestError("uploaderId is required");
    }

    if (!file || !file.buffer) {
      throw new BadRequestError("file buffer is required");
    }

    if (!mimeType) {
      throw new BadRequestError("mimeType is required");
    }

    if (!ALLOWED_RESULT_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestError(`Invalid mimeType. Allowed: ${ALLOWED_RESULT_MIME_TYPES.join(", ")}`);
    }

    if (!originalName) {
      throw new BadRequestError("originalName is required");
    }

    if (!size || size <= 0) {
      throw new BadRequestError("size is required and must be greater than 0");
    }

    const order = await LabOrderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Lab order not found");
    }

    if (order.status !== "ordered" && order.status !== "received") {
      throw new ConflictError(`Cannot add result to order with status: ${order.status}`);
    }

    const s3Key = generateS3Key(orderId, originalName);

    try {
      await S3Service.uploadFile({
        key: s3Key,
        buffer: file.buffer,
        mimeType,
      });

      const resultPayload = {
        orderId,
        uploadedBy: uploaderId,
        s3Key,
        fileName: originalName,
        mimeType,
        size,
        status: "uploaded",
        uploadedAt: new Date(),
      };

      const result = await LabResultRepository.createResult(resultPayload);

      if (order.status === "ordered") {
        await LabOrderRepository.updateStatus(orderId, "received");
      }

      return result;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new BadRequestError(`Failed to add result: ${error.message}`);
    }
  }

  async getResultPresignedUrl(resultId, requester) {
    if (!resultId) {
      throw new BadRequestError("resultId is required");
    }

    if (!requester) {
      throw new BadRequestError("requester is required");
    }

    const result = await LabResultRepository.findById(resultId);
    if (!result) {
      throw new NotFoundError("Lab result not found");
    }

    const order = await LabOrderRepository.findById(result.orderId);
    if (!order) {
      throw new NotFoundError("Lab order not found for this result");
    }

    if (!canAccessResult(result, order, requester)) {
      throw new ForbiddenError("Access denied to this lab result");
    }

    try {
      const url = await S3Service.getPresignedUrl(result.s3Key, 600);
      return url;
    } catch (error) {
      throw new BadRequestError(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  async validateResult(resultId, validatorUserId, validatorRole) {
    if (!resultId) {
      throw new BadRequestError("resultId is required");
    }

    if (!validatorUserId) {
      throw new BadRequestError("validatorUserId is required");
    }

    if (!validatorRole) {
      throw new BadRequestError("validatorRole is required");
    }

    const allowedValidatorRoles = ["doctor", "lab_manager", "admin"];
    if (!allowedValidatorRoles.includes(validatorRole)) {
      throw new ForbiddenError(`Invalid validator role. Allowed: ${allowedValidatorRoles.join(", ")}`);
    }

    const result = await LabResultRepository.findById(resultId);
    if (!result) {
      throw new NotFoundError("Lab result not found");
    }

    const update = {
      status: "validated",
      validatedAt: new Date(),
      metadata: {
        ...(result.metadata || {}),
        validatedBy: validatorUserId,
        validatedByRole: validatorRole,
      },
    };

    const updatedResult = await LabResultRepository.updateResult(resultId, update);

    const order = await LabOrderRepository.findById(result.orderId);
    if (order) {
      const allResults = await LabResultRepository.findByOrder(result.orderId);
      const allValidated = allResults.every((r) => r.status === "validated");

      if (allValidated && order.status !== "validated") {
        await LabOrderRepository.updateStatus(result.orderId, "validated");
      }
    }

    return updatedResult;
  }

  async listOrders(filters = {}, options = {}, requester) {
    if (!requester) {
      throw new BadRequestError("requester is required");
    }

    const requesterId = requester._id ? requester._id.toString() : requester.id?.toString();

    if (!hasRole(requester, "admin") && !hasRole(requester, "lab_manager")) {
      if (hasRole(requester, "doctor")) {
        filters.doctorId = requesterId;
      } else if (hasRole(requester, "patient")) {
        filters.patientId = requesterId;
      } else {
        throw new ForbiddenError("Insufficient permissions to list lab orders");
      }
    }

    return LabOrderRepository.findOrders(filters, options);
  }
}

module.exports = new LaboratoryService();

