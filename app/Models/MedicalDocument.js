const mongoose = require("mongoose")

class MedicalDocumentModel {
  constructor() {
    this.schema = new mongoose.Schema(
      {
        patient: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Patient",
          required: true,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        medicalRecord: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MedicalRecord",
        },
        appointment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Appointment",
        },
        category: {
          type: String,
          enum: ["imaging", "report", "lab_result", "prescription", "other"],
          required: true,
        },
        documentType: {
          type: String,
          enum: ["pdf", "image", "csv"],
          required: true,
        },
        fileName: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
        mimeType: {
          type: String,
          required: true,
        },
        s3Key: {
          type: String,
          required: true,
        },
        s3Url: {
          type: String,
          required: true,
        },
        presignedUrl: String,
        presignedUrlExpiry: Date,
        tags: [String],
        description: String,
        isEncrypted: {
          type: Boolean,
          default: true,
        },
        accessLog: [
          {
            userId: mongoose.Schema.Types.ObjectId,
            accessedAt: Date,
            action: String,
          },
        ],
      },
      { timestamps: true },
    )

    this.schema.index({ patient: 1, createdAt: -1 })
    this.schema.index({ uploadedBy: 1 })
    this.schema.index({ category: 1 })
    this.schema.index({ medicalRecord: 1 })
  }

  getModel() {
    if (mongoose.models && mongoose.models.MedicalDocument) {
      return mongoose.model("MedicalDocument")
    }
    return mongoose.model("MedicalDocument", this.schema)
  }
}

module.exports = new MedicalDocumentModel()
