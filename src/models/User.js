const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    address: { type: String },
  },
  { _id: false }
);

const allowedRoles = [
  "admin",
  "doctor",
  "nurse",
  "receptionist",
  "patient",
  "pharmacist",
  "lab_manager",
];

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    roles: {
      type: [String],
      default: ["patient"],
      enum: allowedRoles,
    },
    profile: ProfileSchema,
    suspended: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);


