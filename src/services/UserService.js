const bcrypt = require("bcrypt");
const UserRepository = require("../repositories/UserRepository");

class UserService {
  async createUser({ email, password, roles, profile }) {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new Error("User with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await UserRepository.create({
      email,
      passwordHash,
      roles,
      profile,
    });

    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.passwordHash;

    return userObj;
  }

  async getUserById(id) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.passwordHash;
    return userObj;
  }

  async updateUser(id, payload) {
    if (Object.prototype.hasOwnProperty.call(payload, "password") || Object.prototype.hasOwnProperty.call(payload, "passwordHash")) {
      throw new Error("Password cannot be updated via updateUser");
    }

    const updated = await UserRepository.updateById(id, payload);
    if (!updated) {
      throw new Error("User not found");
    }

    const userObj = updated.toObject ? updated.toObject() : updated;
    delete userObj.passwordHash;
    return userObj;
  }

  async setSuspended(id, suspended) {
    const updated = await UserRepository.setSuspended(id, suspended);
    if (!updated) {
      throw new Error("User not found");
    }
    const userObj = updated.toObject ? updated.toObject() : updated;
    delete userObj.passwordHash;
    return userObj;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const secretHash = user.passwordHash || user.password;
    if (!secretHash) {
      throw new Error("User has no password set");
    }

    const isValid = await bcrypt.compare(oldPassword, secretHash);
    if (!isValid) {
      throw new Error("Old password is incorrect");
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const updated = await UserRepository.updateById(userId, { passwordHash: newHash });

    const userObj = updated.toObject ? updated.toObject() : updated;
    delete userObj.passwordHash;
    return userObj;
  }
}

module.exports = new UserService();


