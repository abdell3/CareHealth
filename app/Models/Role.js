const mongoose = require('mongoose');

class RoleModel {
  constructor() {
    this.schema = new mongoose.Schema({
      name: {
        type: String,
        required: [true, 'Role name is required'],
        unique: true,
        lowercase: true,
        trim: true
      },
      displayName: {
        type: String,
        required: [true, 'Display name is required'],
        trim: true
      },
      description: {
        type: String,
        required: [true, 'Role description is required'],
        trim: true,
        maxlength: [200, 'Description cannot exceed 200 characters']
      },
      permissions: {
        users: {
          create: { type: Boolean, default: false },
          read: { type: Boolean, default: false },
          update: { type: Boolean, default: false },
          delete: { type: Boolean, default: false },
          suspend: { type: Boolean, default: false }
        },
        patients: {
          create: { type: Boolean, default: false },
          read: { type: Boolean, default: false },
          update: { type: Boolean, default: false },
          delete: { type: Boolean, default: false },
          search: { type: Boolean, default: false }
        },
        appointments: {
          create: { type: Boolean, default: false },
          read: { type: Boolean, default: false },
          update: { type: Boolean, default: false },
          delete: { type: Boolean, default: false },
          viewAll: { type: Boolean, default: false },
          manageConflicts: { type: Boolean, default: false }
        },
        medical: {
          viewHistory: { type: Boolean, default: false },
          addNotes: { type: Boolean, default: false },
          prescribe: { type: Boolean, default: false },
          diagnosis: { type: Boolean, default: false }
        },
        pharmacy : {
          viewPrescriptions : { type : Boolean, default : false },
          dispensePrescriptions : { type : Boolean, default : false },
          managePrescriptionStatus : { type : Boolean, default : false },
          viewPatientInfo : { type : Boolean, default : false },
          sendNotifications : { type : Boolean, default : false }
        },
        documents : {
          upload : { type : Boolean, default : false },
          download : { type : Boolean, default : false },
          delete : { type : Boolean, default : false },
          view : { type : Boolean, default : false }
        },
        notifications: {
          send: { type: Boolean, default: false },
          receive: { type: Boolean, default: false }
        }
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }, {
      timestamps: true
    });

    this.setupIndexes();
    this.setupStatics();
  }

  setupIndexes() {
    this.schema.index({ name: 1 });
    this.schema.index({ isActive: 1 });
  }

  setupStatics() {
    this.schema.statics.findByName = function(name) {
      return this.findOne({ name: name.toLowerCase(), isActive: true });
    };

    this.schema.statics.findActiveRoles = function() {
      return this.find({ isActive: true }).sort({ name: 1 });
    };

    this.schema.statics.initializeDefaultRoles = async function() {
      const defaultRoles = [
        {
          name: 'admin',
          displayName: 'Administrator',
          description: 'Full system access and user management',
          permissions: {
            users: { create: true, read: true, update: true, delete: true, suspend: true },
            patients: { create: true, read: true, update: true, delete: true, search: true },
            appointments: { create: true, read: true, update: true, delete: true, viewAll: true, manageConflicts: true },
            medical: { viewHistory: true, addNotes: true, prescribe: true, diagnosis: true },
            pharmacy : { viewPrescriptions : true, dispensePrescriptions : true, managePrescriptionStatus : true, viewPatientInfo : true, sendNotifications : true },
            documents : { upload : true, download : true, delete : true, view : true },
            notifications: { send: true, receive: true }
          }
        },
        {
          name: 'doctor',
          displayName: 'Doctor',
          description: 'Medical professional with full patient care access',
          permissions: {
            users: { create: false, read: true, update: false, delete: false, suspend: false },
            patients: { create: true, read: true, update: true, delete: false, search: true },
            appointments: { create: true, read: true, update: true, delete: true, viewAll: false, manageConflicts: true },
            medical: { viewHistory: true, addNotes: true, prescribe: true, diagnosis: true },
            pharmacy : { viewPrescription : true, dispensePrescriptions : false, managePrescriptionStatus : false, viewPatient : false, sendNotifications : false },
            documents : { upload : true, download : true, delete : true, view : true },
            notifications: { send: true, receive: true }
          }
        },
        {
          name: 'nurse',
          displayName: 'Nurse',
          description: 'Healthcare provider with patient care and appointment management',
          permissions: {
            users: { create: false, read: true, update: false, delete: false, suspend: false },
            patients: { create: true, read: true, update: true, delete: false, search: true },
            appointments: { create: true, read: true, update: true, delete: true, viewAll: false, manageConflicts: true },
            medical: { viewHistory: true, addNotes: true, prescribe: false, diagnosis: false },
            pharmacy : { viewPrescription : false, dispensePrescriptions : false, managePrescriptionStatus : false, viewPatient : false, sendNotifications : false },
            documents : { upload : true, download : true, delete : false, view : true },
            notifications: { send: true, receive: true }
          }
        },
        {
          name: 'secretary',
          displayName: 'Secretary',
          description: 'Administrative staff for appointment scheduling and patient coordination',
          permissions: {
            users: { create: false, read: true, update: false, delete: false, suspend: false },
            patients: { create: true, read: true, update: true, delete: false, search: true },
            appointments: { create: true, read: true, update: true, delete: true, viewAll: true, manageConflicts: true },
            medical: { viewHistory: false, addNotes: false, prescribe: false, diagnosis: false },
            pharmacy : { viewPrescription : false, dispensePrescriptions : false, managePrescriptionStatus : false, viewPatient : false, sendNotifications : false },
            documents : { upload : false, download : false, delete : false, view : false },
            notifications: { send: true, receive: true }
          }
        },
        {
          name : 'pharmacist',
          displayName : 'Pharmacist',
          description : 'Pharmacy Professional Managing Prescriptions And Mediciations',
          permissions : {
            users: { create: false, read: true, update: false, delete: false, suspend: false },
            patients: { create: false, read: true, update: false, delete: false, search: true },
            appointments: { create: false, read: true, update: false, delete: false, viewAll: false, manageConflicts: false },
            medical: { viewHistory: true, addNotes: false, prescribe: false, diagnosis: false },
            pharmacy : { viewPrescription : true, dispensePrescriptions : true, managePrescriptionStatus : true, viewPatient : true, sendNotifications : true },
            documents : { upload : false, download : true, delete : false, view : true },
            notifications: { send: true, receive: true }
          },
        },
        {
          name: 'patient',
          displayName: 'Patient',
          description: 'Patient with limited access to own profile and appointments',
          permissions: {
            users: { create: false, read: false, update: false, delete: false, suspend: false },
            patients: { create: false, read: true, update: true, delete: false, search: false },
            appointments: { create: true, read: true, update: true, delete: true, viewAll: false, manageConflicts: false },
            medical: { viewHistory: true, addNotes: false, prescribe: false, diagnosis: false },
            pharmacy : { viewPrescription : true, dispensePrescriptions : false, managePrescriptionStatus : false, viewPatient : false, sendNotifications : false },
            documents : { upload : false, download : true, delete : false, view : true },
            notifications: { send: false, receive: true }
          }
        }
      ];

      for (const roleData of defaultRoles) {
        const existingRole = await this.findOne({ name: roleData.name });
        if (!existingRole) {
          await this.create(roleData);
        }
      }
    };
  }

  getModel() {
    if (mongoose.models && mongoose.models.Role) {
      return mongoose.model('Role');
    }
    return mongoose.model('Role', this.schema);  }
}

module.exports = new RoleModel();
