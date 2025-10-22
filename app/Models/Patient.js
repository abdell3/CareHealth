const mongoose = require('mongoose');

class PatientModel {
  constructor() {
    this.schema = new mongoose.Schema({
      firstName: { 
        type: String, 
        required: true, 
        trim: true 
    },
      lastName: { 
        type: String, 
        required: true, 
        trim: true 
    },
      dateOfBirth: { 

        type: Date, 
        required: true 
    },
      gender: { 
        type: String, 
        enum: ['male','female','other'], 
        required: true 
    },
      phone: { 
        type: String, 
        trim: true 
    },
      email: { 
        type: String, 
        trim: true, 
        lowercase: true 
    },
      address: { 
        type: String, 
        trim: true 
    },
      allergies: [{ 
        type: String, 
        trim: true 
    }],
      medications: [{ 
        type: String, 
        trim: true 
    }],
      insurance: {
        provider: { 
            type: String, 
            trim: true 
        },
        policyNumber: { 
            type: String, 
            trim: true 
        }
      },
      emergencyContacts: [{ 
        name: String, 
        relation: String, 
        phone: String 
      }],
      user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
        },
    }, { 
        timestamps: true 
    });

    this.schema.index({ 
        lastName: 1, 
        firstName: 1 
    });
    this.schema.index({ 
        phone: 1 
    });
    this.schema.index({ 
        email: 1 
    });
  }

  getModel() {
    if (mongoose.models && mongoose.models.Patient) {
      return mongoose.model('Patient');
    }
    return mongoose.model('Patient', this.schema);
  }
}

module.exports = new PatientModel();


