const AppointmentModel = require("../Models/Appointment");

class AppointmentRepository {
  constructor() {
    this.App = AppointmentModel.getModel();
  }

  async create(data) {
    const doc = new this.App(data);
    return doc.save();
  }

  async findById(id) {
    return this.App.findById(id).populate("doctor").populate("patient");
  }

  async findByDoctorBetween(doctorId, start, end) {
    return this.App.find({
      doctor: doctorId,
      status: { $ne: "cancelled" },
      $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
    })
      .populate("doctor")
      .populate("patient");
  }

  async findByPatientBetween(patientId, start, end) {
    return this.App.find({
      patient: patientId,
      status: { $ne: "cancelled" },
      $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
    })
      .populate("doctor")
      .populate("patient");
  }

  async list(filters = {}) {
    const q = {};
    if (filters.doctor) {
      q.doctor = filters.doctor;
    }
    if (filters.patient) {
      q.patient = filters.patient;
    }
    if (filters.status) {
      q.status = filters.status;
    }
    if (filters.from || filters.to) {
      q.startTime = {};
      if (filters.from) {
        q.startTime.$gte = new Date(filters.from);
      }
      if (filters.to) {
        q.startTime.$lte = new Date(filters.to);
      }
    }
    const page = Math.max(Number.parseInt(filters.page) || 1, 1);
    const limit = Math.min(Number.parseInt(filters.limit) || 50, 200);
    const skip = (page - 1) * limit ;

    const docs = await this.App.find(q)
      .populate("doctor", "firstName lastName email role")
      .populate("patient", "firstName lastName dateOfBirth phone")
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit);

    const total = await this.App.countDocuments(q);
    return { 
      data: docs, 
      meta: { 
        page, 
        limit, 
        total 
      } 
    }
  }

  async update(id, data) {
    return this.App.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return this.App.findByIdAndDelete(id);
  }
}

module.exports = new AppointmentRepository();
