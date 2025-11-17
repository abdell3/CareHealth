const ConsultationRepository = require("../repositories/ConsultationRepository");
const AppointmentModel = require("../modules/appointments/Appointment");

class ConsultationService {
  async createConsultation(payload, createdBy) {
    if (payload.appointmentId) {
      const Appointment =
        typeof AppointmentModel.getModel === "function"
          ? AppointmentModel.getModel()
          : AppointmentModel;
      const appointment = await Appointment.findById(payload.appointmentId);
      if (!appointment) {
        throw new Error("Appointment not found");
      }
    }

    const data = {
      ...payload,
      createdBy,
    };
    return ConsultationRepository.create(data);
  }

  async getConsultationById(id) {
    const consultation = await ConsultationRepository.findById(id);
    if (!consultation) {
      throw new Error("Consultation not found");
    }
    return consultation;
  }

  async listByPatient(patientId, options = {}) {
    return ConsultationRepository.findByPatient(patientId, options);
  }

  async updateConsultation(id, payload) {
    const updated = await ConsultationRepository.updateById(id, payload);
    if (!updated) {
      throw new Error("Consultation not found");
    }
    return updated;
  }
}

module.exports = new ConsultationService();


