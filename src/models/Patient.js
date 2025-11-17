const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    type: { type: String },
    value: { type: String },
  },
  { _id: false }
);

const AddressSchema = new mongoose.Schema(
  {
    line1: { type: String },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String },
  },
  { _id: false }
);

const InsuranceSchema = new mongoose.Schema(
  {
    provider: { type: String },
    policyNumber: { type: String },
  },
  { _id: false }
);

const ConsentsSchema = new mongoose.Schema(
  {
    marketing: { type: Boolean, default: false },
    shareData: { type: Boolean, default: false },
  },
  { _id: false }
);

const PatientSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "unknown"],
    },
    contacts: [ContactSchema],
    address: AddressSchema,
    insurance: InsuranceSchema,
    allergies: [String],
    medicalHistory: [String],
    consents: ConsentsSchema,
  },
  {
    timestamps: true,
  }
);

PatientSchema.index({ lastName: 1, firstName: 1 });

module.exports = mongoose.model("Patient", PatientSchema);


