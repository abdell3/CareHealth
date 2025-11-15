const MedicalDocumentRepository = require("../Repositories/MedicalDocumentRepository")
const PatientRepository = require("../Repositories/PatientRepository")
const S3Service = require("./S3Service")

class MedicalDocumentService {
  async upload(data) {
    const patient = await PatientRepository.findById(data.patientId)
    if (!patient) {
      const err = new Error("Patient not found")
      err.statusCode = 404
      throw err
    }

    if (data.fileSize > 20 * 1024 * 1024) {
      const err = new Error("File size exceeds 20MB limit")
      err.statusCode = 400
      throw err
    }

    const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "text/csv"]
    if (!allowedMimes.includes(data.mimeType)) {
      const err = new Error("Invalid file type")
      err.statusCode = 400
      throw err
    }

    const s3Result = await S3Service.uploadFile({
      patientId: data.patientId,
      fileName: data.fileName,
      buffer: data.fileBuffer,
      mimeType: data.mimeType,
    })

    const documentData = {
      patient: data.patientId,
      uploadedBy: data.uploadedBy,
      medicalRecord: data.medicalRecordId,
      appointment: data.appointmentId,
      category: data.category,
      documentType: data.documentType,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      s3Key: s3Result.key,
      tags: Array.isArray(data.tags) ? data.tags : [],
      description: data.description,
    }

    return MedicalDocumentRepository.create(documentData)
  }

  async getByPatient(patientId, filters = {}) {
    return MedicalDocumentRepository.findByPatient(patientId, filters)
  }

  async getById(id) {
    const document = await MedicalDocumentRepository.findById(id)
    if (!document) {
      const err = new Error("Document not found")
      err.statusCode = 404
      throw err
    }

    await document.populate([
      {
        path: "patient",
        populate: {
          path: "user",
          select: "email role",
        },
      },
      {
        path: "uploadedBy",
        select: "firstName lastName email role",
      },
      {
        path: "appointment",
        select: "doctor patient",
        populate: {
          path: "doctor",
          select: "firstName lastName email role",
        },
      },
    ])

    return document
  }

  async getPresignedUrl(id, userId) {
    const document = await MedicalDocumentRepository.findById(id)
    if (!document) {
      const err = new Error("Document not found")
      err.statusCode = 404
      throw err
    }

    // Log access
    await MedicalDocumentRepository.logAccess(id, userId, "download_requested")

    // Generate presigned URL (10 minutes expiry)
    const presignedUrl = await S3Service.getPresignedUrl(document.s3Key, 600)

    return {
      url: presignedUrl,
      expiresIn: 600,
    }
  }

  async delete(id) {
    const document = await MedicalDocumentRepository.findById(id)
    if (!document) {
      const err = new Error("Document not found")
      err.statusCode = 404
      throw err
    }

    // Delete from S3
    await S3Service.deleteFile(document.s3Key)

    // Delete from database
    return MedicalDocumentRepository.delete(id)
  }

  async search(patientId, query) {
    const documents = await MedicalDocumentRepository.findByPatient(patientId, {
      tags: query.tags,
      category: query.category,
      documentType: query.documentType,
    })
    return documents
  }
}

module.exports = new MedicalDocumentService()
