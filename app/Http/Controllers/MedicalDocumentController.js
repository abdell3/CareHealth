const { validationResult } = require("express-validator");
const MedicalDocumentService = require("../../Services/MedicalDocumentService");

const MIME_TO_TYPE = {
  "application/pdf": "pdf",
  "image/jpeg": "image",
  "image/png": "image",
  "text/csv": "csv",
};

const parseTags = (raw) => {
  if (!raw) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      return raw
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }
  }
  return [];
};

const canAccessDocument = (document, user, expectedPatientId) => {
  if (!document || !user) {
    return false;
  }
  const roleName = user.role?.name;
  const userId = user._id?.toString();
  const documentPatientId = document.patient?._id?.toString();
  const routeMatches =
    expectedPatientId === undefined || documentPatientId === expectedPatientId;
  if (!routeMatches) {
    return false;
  }
  const patientUserId = document.patient?.user?._id?.toString();
  const uploaderId = document.uploadedBy?._id?.toString();
  const appointmentDoctorId =
    document.appointment?.doctor?._id?.toString() ||
    document.appointment?.doctor?.toString?.();

  if (roleName === "admin") {
    return true;
  }
  if (patientUserId && patientUserId === userId) {
    return true;
  }
  if (uploaderId && uploaderId === userId) {
    return true;
  }
  if (roleName === "doctor" && appointmentDoctorId && appointmentDoctorId === userId) {
    return true;
  }
  return false;
};

class MedicalDocumentController {
  async upload(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { patientId, medicalRecordId, appointmentId, category, description, tags } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file provided",
        });
      }

      const documentType = MIME_TO_TYPE[req.file.mimetype];
      if (!documentType) {
        return res.status(400).json({
          success: false,
          message: "Invalid file type",
        });
      }

      const document = await MedicalDocumentService.upload({
        patientId,
        uploadedBy: req.user._id,
        medicalRecordId,
        appointmentId,
        category,
        documentType,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileBuffer: req.file.buffer,
        description,
        tags: parseTags(tags),
      });

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: document,
      });
    } catch (error) {
      const isSizeError = error.code === "LIMIT_FILE_SIZE";
      const statusCode = isSizeError ? 400 : error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: isSizeError ? "File size exceeds 20MB limit" : error.message,
      });
    }
  }

  async getByPatient(req, res) {
    try {
      const { patientId } = req.params;
      const { category, documentType, tags, page, limit } = req.query;

      const documents = await MedicalDocumentService.getByPatient(patientId, {
        category,
        documentType,
        tags: tags ? tags.split(",") : [],
        page,
        limit,
      });

      res.json({
        success: true,
        data: documents.data,
        meta: documents.meta,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const document = await MedicalDocumentService.getById(id);

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getPresignedUrl(req, res) {
    try {
      const { id } = req.params;

      const result = await MedicalDocumentService.getPresignedUrl(id, req.user._id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await MedicalDocumentService.delete(id);

      res.json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async search(req, res) {
    try {
      const { patientId } = req.params;
      const { tags, category, documentType } = req.query;

      const results = await MedicalDocumentService.search(patientId, {
        tags: tags ? tags.split(",") : [],
        category,
        documentType,
      });

      res.json({
        success: true,
        data: results.data,
        meta: results.meta,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getPatientDocumentPresigned(req, res) {
    try {
      const { id: patientId, docId } = req.params;
      const document = await MedicalDocumentService.getById(docId);

      if (!canAccessDocument(document, req.user, patientId)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      const result = await MedicalDocumentService.getPresignedUrl(docId, req.user._id);

      res.json({
        success: true,
        data: { url: result.url },
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new MedicalDocumentController();
