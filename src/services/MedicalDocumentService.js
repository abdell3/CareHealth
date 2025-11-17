const S3Service = require("./S3Service");
const MedicalDocumentRepository = require("../repositories/MedicalDocumentRepository");
const { Patient } = require("../models");
const { BadRequestError } = require("../core/errors/BadRequestError");
const { NotFoundError } = require("../core/errors/NotFoundError");
const { AppError } = require("../core/errors/AppError");
const crypto = require("crypto");

function generateRandomString(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

function generateS3Key(patientId, originalName) {
  const timestamp = Date.now();
  const random8 = generateRandomString(8);
  const sanitizedFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `documents/${patientId}/${timestamp}-${random8}-${sanitizedFileName}`;
}

function hasRole(user, role) {
  if (!user || !user.roles) {
    return false;
  }
  return Array.isArray(user.roles) ? user.roles.includes(role) : user.roles === role;
}

function canAccessDocument(document, requester) {
  if (!document || !requester) {
    return false;
  }

  const requesterId = requester._id ? requester._id.toString() : requester.id?.toString();
  const documentPatientId = document.patientId ? document.patientId.toString() : null;
  const documentUploaderId = document.uploaderId ? document.uploaderId.toString() : null;

  if (hasRole(requester, "admin")) {
    return true;
  }

  if (hasRole(requester, "lab_manager")) {
    return true;
  }

  if (documentPatientId && requesterId === documentPatientId) {
    return true;
  }

  if (hasRole(requester, "doctor")) {
    return true;
  }

  return false;
}

function canDeleteDocument(document, requester) {
  if (!document || !requester) {
    return false;
  }

  const requesterId = requester._id ? requester._id.toString() : requester.id?.toString();
  const documentUploaderId = document.uploaderId ? document.uploaderId.toString() : null;

  if (hasRole(requester, "admin")) {
    return true;
  }

  if (documentUploaderId && requesterId === documentUploaderId) {
    return true;
  }

  return false;
}

class MedicalDocumentService {
  async uploadDocument({ patientId, uploaderId, file }) {
    if (!file) {
      throw new BadRequestError("File is required");
    }

    if (!file.buffer) {
      throw new BadRequestError("File buffer is required");
    }

    if (!file.mimetype) {
      throw new BadRequestError("File mimetype is required");
    }

    if (!file.originalname) {
      throw new BadRequestError("File original name is required");
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new NotFoundError("Patient not found");
    }

    const s3Key = generateS3Key(patientId, file.originalname);

    try {
      const s3Result = await S3Service.uploadFile({
        key: s3Key,
        buffer: file.buffer,
        mimeType: file.mimetype,
      });

      const metadata = {
        patientId,
        uploaderId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size || s3Result.size,
        s3Key: s3Result.key,
        category: file.category,
        tags: file.tags || [],
      };

      const document = await MedicalDocumentRepository.create(metadata);

      return document;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to upload document: ${error.message}`, 500);
    }
  }

  async getDocumentPresignedUrl(documentId, requester) {
    const document = await MedicalDocumentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundError("Document not found");
    }

    if (!canAccessDocument(document, requester)) {
      throw new AppError("Access denied", 403);
    }

    try {
      const url = await S3Service.getPresignedUrl(document.s3Key, 600);

      return url;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to generate presigned URL: ${error.message}`, 500);
    }
  }

  async deleteDocument(documentId, requester) {
    const document = await MedicalDocumentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundError("Document not found");
    }

    if (!canDeleteDocument(document, requester)) {
      throw new AppError("Access denied. Only admin or uploader can delete documents.", 403);
    }

    try {
      await S3Service.deleteFile(document.s3Key);

      await MedicalDocumentRepository.deleteById(documentId);

      return { success: true };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to delete document: ${error.message}`, 500);
    }
  }
}

module.exports = new MedicalDocumentService();

