const mongoose = require("mongoose")

class MedicalRecordModel {
  constructor() {
    this.schema = new mongoose.Schema(
      {
        patient: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Patient",
          required: true,
        },
        doctor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        appointment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Appointment",
        },
        recordType: {
          type: String,
          enum: ["consultation", "diagnosis", "treatment", "follow-up"],
          required: true,
        },
        diagnosis: {
          type: String,
          trim: true,
        },
        symptoms: [String],
        vitalSigns: {
          bloodPressure: String,
          temperature: Number,
          heartRate: Number,
          respiratoryRate: Number,
          weight: Number,
          height: Number,
        },
        treatment: {
          type: String,
          trim: true,
        },
        notes: {
          type: String,
          trim: true,
        },
        recordDate: {
          type: Date,
          default: Date.now,
        },
      },
      { timestamps: true },
    );

    this.schema.index({ patient: 1, recordDate: -1 });
    this.schema.index({ doctor: 1 });
    this.schema.index({ appointment: 1 });
  }

  getModel() {
    if (mongoose.models && mongoose.models.MedicalRecord) {
      return mongoose.model("MedicalRecord");
    }
    return mongoose.model("MedicalRecord", this.schema);
  }
}

module.exports = new MedicalRecordModel();
