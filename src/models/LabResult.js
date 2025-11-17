const mongoose = require("mongoose");

const LabResultSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabOrder",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
      index: true,
    },
    fileName: {
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
    status: {
      type: String,
      enum: ["pending", "uploaded", "validated"],
      default: "pending",
    },
    flags: [String],
    uploadedAt: {
      type: Date,
    },
    validatedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

LabResultSchema.index({ s3Key: 1 });
LabResultSchema.index({ orderId: 1 });
LabResultSchema.index({ status: 1 });

module.exports = mongoose.model("LabResult", LabResultSchema);

