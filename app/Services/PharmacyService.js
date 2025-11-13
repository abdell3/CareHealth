const PharmacyRepository = require("../Repositories/PharmacyRepository");
const UserRepository = require("../Repositories/UserRepository");

class PharmacyService {
  async create(data) {
    const existingEmail = await PharmacyRepository.findByEmail(data.email);
    if (existingEmail) {
      const err = new Error("Pharmacy with this email already exists");
      err.statusCode = 409;
      throw err;
    }

    const existingLicense = await PharmacyRepository.findByLicenseNumber(data.licenseNumber);
    if (existingLicense) {
      const err = new Error("Pharmacy with this license number already exists");
      err.statusCode = 409;
      throw err;
    }
    return PharmacyRepository.create(data);
  }

  async getAll(filters = {}) {
    return PharmacyRepository.findAll(filters);
  }

  async getById(id) {
    const pharmacy = await PharmacyRepository.findById(id);
    if (!pharmacy) {
      const err = new Error("Pharmacy not found");
      err.statusCode = 404;
      throw err;
    }
    return pharmacy;
  }

  async update(id, data) {
    const pharmacy = await PharmacyRepository.findById(id);
    if (!pharmacy) {
      const err = new Error("Pharmacy not found");
      err.statusCode = 404;
      throw err;
    }

    if (data.email && data.email !== pharmacy.email) {
      const existingEmail = await PharmacyRepository.findByEmail(data.email);
      if (existingEmail) {
        const err = new Error("Email already in use");
        err.statusCode = 409;
        throw err;
      }
    }
    return PharmacyRepository.update(id, data);
  }

  async addStaff(pharmacyId, userId) {
    const pharmacy = await PharmacyRepository.findById(pharmacyId);
    if (!pharmacy) {
      const err = new Error("Pharmacy not found");
      err.statusCode = 404;
      throw err;
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    return PharmacyRepository.addStaff(pharmacyId, userId);
  }

  async removeStaff(pharmacyId, userId) {
    const pharmacy = await PharmacyRepository.findById(pharmacyId);
    if (!pharmacy) {
      const err = new Error("Pharmacy not found");
      err.statusCode = 404;
      throw err;
    }
    return PharmacyRepository.removeStaff(pharmacyId, userId);
  }

  async delete(id) {
    const pharmacy = await PharmacyRepository.findById(id);
    if (!pharmacy) {
      const err = new Error("Pharmacy not found");
      err.statusCode = 404;
      throw err;
    }
    return PharmacyRepository.delete(id);
  }
}

module.exports = new PharmacyService();
