const PharmacyRepository = require("../repositories/PharmacyRepository");
const PrescriptionRepository = require("../repositories/PrescriptionRepository");
const { Prescription } = require("../models");
const redisClient = require("../core/utils/redisClient");
const { BadRequestError } = require("../core/errors/BadRequestError");
const { NotFoundError } = require("../core/errors/NotFoundError");
const { AppError } = require("../core/errors/AppError");

const QUEUE_KEY = "queue:pharmacy:notifications";

function hasRole(user, role) {
  if (!user || !user.roles) {
    return false;
  }
  if (Array.isArray(user.roles)) {
    return user.roles.includes(role);
  }
  return user.role === role;
}

class PharmacyService {
  async createPharmacy(payload) {
    if (!payload.name) {
      throw new BadRequestError("Pharmacy name is required");
    }

    if (!payload.identifier) {
      throw new BadRequestError("Pharmacy identifier is required");
    }

    const existing = await PharmacyRepository.findByIdentifier(payload.identifier);
    if (existing) {
      throw new BadRequestError("Pharmacy with this identifier already exists");
    }

    try {
      const pharmacy = await PharmacyRepository.create(payload);
      return pharmacy;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to create pharmacy: ${error.message}`, 500);
    }
  }

  async updatePharmacy(id, payload) {
    const pharmacy = await PharmacyRepository.findById(id);

    if (!pharmacy) {
      throw new NotFoundError("Pharmacy not found");
    }

    if (payload.identifier) {
      const existing = await PharmacyRepository.findByIdentifier(payload.identifier);
      if (existing && existing._id.toString() !== id.toString()) {
        throw new BadRequestError("Pharmacy with this identifier already exists");
      }
    }

    try {
      const updated = await PharmacyRepository.updateById(id, payload);
      return updated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to update pharmacy: ${error.message}`, 500);
    }
  }

  async assignPrescriptionToPharmacy(prescriptionId, pharmacyId, assignedBy) {
    const prescription = await PrescriptionRepository.findById(prescriptionId);

    if (!prescription) {
      throw new NotFoundError("Prescription not found");
    }

    const pharmacy = await PharmacyRepository.findById(pharmacyId);

    if (!pharmacy) {
      throw new NotFoundError("Pharmacy not found");
    }

    if (!pharmacy.enabled) {
      throw new BadRequestError("Pharmacy is not enabled");
    }

    try {
      await PrescriptionRepository.assignToPharmacy(prescriptionId, pharmacyId);

      await PrescriptionRepository.updateStatus(prescriptionId, "sent");

      const patientId = prescription.patient
        ? prescription.patient._id || prescription.patient
        : prescription.patient;

      const notificationJob = {
        prescriptionId: prescriptionId.toString(),
        pharmacyId: pharmacyId.toString(),
        patientId: patientId ? patientId.toString() : null,
        status: "sent",
      };

      await redisClient.lpush(QUEUE_KEY, JSON.stringify(notificationJob));

      const updated = await PrescriptionRepository.findById(prescriptionId);

      return updated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to assign prescription to pharmacy: ${error.message}`, 500);
    }
  }

  async listPrescriptionsForPharmacy(pharmacyId, filters = {}) {
    const pharmacy = await PharmacyRepository.findById(pharmacyId);

    if (!pharmacy) {
      throw new NotFoundError("Pharmacy not found");
    }

    try {
      const prescriptions = await PrescriptionRepository.listByPharmacy(pharmacyId, filters);
      return prescriptions;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to list prescriptions: ${error.message}`, 500);
    }
  }

  async updatePrescriptionStatus(prescriptionId, status, updatedBy) {
    const prescription = await PrescriptionRepository.findById(prescriptionId);

    if (!prescription) {
      throw new NotFoundError("Prescription not found");
    }

    if (!updatedBy) {
      throw new BadRequestError("updatedBy is required");
    }

    const restrictedStatuses = ["dispensed", "unavailable"];

    if (restrictedStatuses.includes(status)) {
      if (!hasRole(updatedBy, "pharmacist") && !hasRole(updatedBy, "admin")) {
        throw new AppError("Only pharmacist or admin can set status to dispensed or unavailable", 403);
      }
    }

    try {
      const updated = await PrescriptionRepository.updateStatus(prescriptionId, status);

      const patientId = prescription.patient
        ? prescription.patient._id || prescription.patient
        : prescription.patient;
      const pharmacyId = prescription.pharmacy
        ? prescription.pharmacy._id || prescription.pharmacy
        : prescription.pharmacy;

      if (pharmacyId) {
        const notificationJob = {
          prescriptionId: prescriptionId.toString(),
          pharmacyId: pharmacyId.toString(),
          patientId: patientId ? patientId.toString() : null,
          status: status,
        };

        await redisClient.lpush(QUEUE_KEY, JSON.stringify(notificationJob));
      }

      return updated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to update prescription status: ${error.message}`, 500);
    }
  }
}

module.exports = new PharmacyService();

