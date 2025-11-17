const mongoose = require('mongoose');

class RefreshTokenModel {
  constructor() {
    this.schema = new mongoose.Schema(
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        token: {
          type: String,
          required: true,
          unique: true,
          index: true,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
      { timestamps: false },
    );

    this.schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  }

  getModel() {
    if (mongoose.models && mongoose.models.RefreshToken) {
      return mongoose.model('RefreshToken');
    }
    return mongoose.model('RefreshToken', this.schema);
  }
}

module.exports = new RefreshTokenModel();

