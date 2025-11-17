const mongoose = require("mongoose");

const LabOrderSchema = new mongoose.Schema({
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
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultation",
  },
  tests: [
    {
      testCode: {
        type: String,
        required: true,
      },
      testName: {
        type: String,
        required: true,
      },
    },
  ],
  status: {
    type: String,
    enum: ["ordered", "received", "validated"],
    default: "ordered",
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("LabOrder", LabOrderSchema);


