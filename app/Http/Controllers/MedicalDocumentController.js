const { validationResult } = require("express-validator");
const MedicalDocumentService = require("../../Services/MedicalDocumentService");

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

      const document = await MedicalDocumentService.upload({
        patientId,
        uploadedBy: req.user._id,
        medicalRecordId,
        appointmentId,
        category,
        documentType: req.file.mimetype.split("/")[1],
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileBuffer: req.file.buffer,
        description,
        tags: tags ? JSON.parse(tags) : [],
      });

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
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
}

module.exports = new MedicalDocumentController();
