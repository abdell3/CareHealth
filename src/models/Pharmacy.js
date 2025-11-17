const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
  {
    line1: { type: String },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String },
  },
  { _id: false }
);

const ContactSchema = new mongoose.Schema(
  {
    phone: { type: String },
    email: { type: String },
  },
  { _id: false }
);

const HoursSchema = new mongoose.Schema(
  {
    day: { type: String },
    open: { type: String },
    close: { type: String },
  },
  { _id: false }
);

const PharmacySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    identifier: {
      type: String,
      required: true,
      unique: true,
    },
    address: AddressSchema,
    contact: ContactSchema,
    hours: [HoursSchema],
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

PharmacySchema.index({ identifier: 1 }, { unique: true });

module.exports = mongoose.model("Pharmacy", PharmacySchema);

