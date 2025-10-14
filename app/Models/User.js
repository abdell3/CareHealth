const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

class UserModel {
  constructor() {
    this.schema = new mongoose.Schema({
      firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
      },
      lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
      },
      password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
      },
      role: {
        type: String,
        enum: ['admin', 'doctor', 'nurse', 'secretary', 'patient'],
        required: [true, 'Role is required'],
        default: 'patient'
      },
      phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
      },
      isActive: {
        type: Boolean,
        default: true
      },
      isEmailVerified: {
        type: Boolean,
        default: false
      },
      passwordResetToken: String,
      passwordResetExpires: Date,
      lastLogin: Date
    }, {
      timestamps: true
    });

    this.setupMiddleware();
    this.setupMethods();
    this.setupStatics();
  }

  setupMiddleware() {
    this.schema.pre('save', async function(next) {
      if (!this.isModified('password')) return next();
      
      try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
      } catch (error) {
        next(error);
      }
    });
  }

  setupMethods() {
    this.schema.methods.comparePassword = async function(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    };

    this.schema.methods.generatePasswordResetToken = function() {
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
      
      return resetToken;
    };
  }

  setupStatics() {
    this.schema.statics.findByEmail = function(email) {
      return this.findOne({ email: email.toLowerCase() });
    };
  }

  getModel() {
    return mongoose.model('User', this.schema);
  }
}

module.exports = new UserModel();