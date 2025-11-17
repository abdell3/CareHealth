const mongoose = require("mongoose");

const MedicalDocumentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["imaging", "report", "prescription", "other"],
    },
    tags: [String],
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

MedicalDocumentSchema.index({ s3Key: 1 });
MedicalDocumentSchema.index({ patientId: 1, createdAt: -1 });
MedicalDocumentSchema.index({ uploaderId: 1 });

module.exports = mongoose.model("MedicalDocument", MedicalDocumentSchema);

