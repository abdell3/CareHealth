const mongoose = require('mongoose');

class PrescriptionModel {
    constructor() {
        this.Schema = new mongoose.Schema({
            patient : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'Patient',
                required : true
            },
            doctor : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'User',
                required : true 
            },
            medicalRecord : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'MedicalRecord',
                require: true
            }, 
            pharmacy : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'Pharmacy',
            },
            medication : [
                {
                    name : {
                        type : String,
                        require : true,
                        trim : true
                    },
                    dosage : {
                        type : String,
                        require : true,
                        trim : true
                    },
                    frequence : {
                        type : String,
                        trim : true,
                    },
                    duration : {
                        type : String, 
                        require : true,
                        trim : true 
                    },
                    instruction : {
                        type : String, 
                        trim : true,
                    },
                    route : {
                        type : String,
                        enum : ['oral', 'injection', 'topical', 'inhalation', 'other'],
                        default : 'oral'
                    }
                },
            ],
            status : {
                type : String,
                enum : ['draft', 'signed', 'sent', 'dispensed', 'cancelled'],
                default : 'draft'
            },
            prescriptionDate : {
                type : Date,
                default : Date.now
            },
            expireyDate : Date,
            signedAt : Date,
            sentAt : Date,
            dispensedAt : Date,
            notes : {
                type : String, 
                trim : true 
            },
            renewals : {
                type : Number,
                default : 0
            },
            maxRenewals : {
                type : Number,
                default : 0,
            }
        }, {
            timestamps : true
        }) 
        this.Schema.index({
            patient : 1 ,
            prescriptionDate : -1
        });
        this.Schema.index({
            doctor : 1
        });
        this.Schema.index({
            pharmacy : 1
        });
        this.Schema.index({
            status : 1
        });
    }

    getModel() {
        if(mongoose.models && mongoose.models.PrescriptionModel){
            return mongoose.model('Prescription'); 
        }
        return mongoose.model('Prescription', this.schema);
    }
}

module.exports = new PrescriptionModel();