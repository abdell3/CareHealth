const mongoose = require("mongoose");

const VitalsSchema = new mongoose.Schema(
  {
    bloodPressure: { type: String },
    heartRate: { type: Number },
    temperature: { type: Number },
    weight: { type: Number },
    height: { type: Number },
  },
  { _id: false }
);

const DiagnosisSchema = new mongoose.Schema(
  {
    code: { type: String },
    description: { type: String },
  },
  { _id: false }
);

const ProcedureSchema = new mongoose.Schema(
  {
    code: { type: String },
    description: { type: String },
  },
  { _id: false }
);

const ConsultationSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
    },
    vitals: VitalsSchema,
    diagnoses: [DiagnosisSchema],
    procedures: [ProcedureSchema],
    prescriptions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Prescription",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Consultation", ConsultationSchema);


