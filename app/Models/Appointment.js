const mongoose = require('mongoose');

class AppointmentModel {
  constructor() {
    this.schema = new mongoose.Schema({
      doctor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
      },
      patient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Patient', 
        required: true 
      },
      startTime: { 
        type: Date, 
        required: true 
      },
      endTime: { 
        type: Date, 
        required: true 
      },
      status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
      },
      duration: { 
        type: Number, 
        default: 30 
      }, 
      notes: { 
        type: String 
      },
      cancelledBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    cancelledAt: { 
      type: Date 
    },
    cancellationReason: { 
      type: String 
    },
    reminderSent: { 
      type: Boolean, 
      default: false 
    },
    reminderSentAt: { 
      type: Date 
    }
  }, { timestamps: true });

    this.schema.index({ doctor: 1, startTime: 1, endTime: 1 });
  }

  getModel() {
    if (mongoose.models && mongoose.models.Appointment) {
      return mongoose.model('Appointment');
    }
    return mongoose.model('Appointment', this.schema);
  }
}

module.exports = new AppointmentModel();
