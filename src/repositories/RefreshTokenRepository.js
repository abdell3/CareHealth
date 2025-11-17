const BaseRepository = require("./BaseRepository");
const { RefreshToken } = require("../models");

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super(RefreshToken);
  }

  async save(tokenRecord) {
    return this.create(tokenRecord);
  }

  async findByToken(token) {
    return this.findOne({ token });
  }

  async revoke(token) {
    return this.deleteById(
      (await this.findOne({ token }))?._id
    );
  }

  async revokeByUser(userId) {
    return RefreshToken.deleteMany({ user: userId });
  }

  async deleteExpired(now = new Date()) {
    return RefreshToken.deleteMany({ expiresAt: { $lte: now } });
  }
}

module.exports = new RefreshTokenRepository();


