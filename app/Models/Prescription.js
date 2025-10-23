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
                },
            ],
            status : {
                type : String,
                enum : ['Draft', 'Signed', 'Sent', 'Dispensed'],
                default : 'Draft'
            },
            prescriptionDate : {
                type : Date,
                default : Date.now
            },
            expireDate : Date,
            notes : {
                type : String, 
                trim : true 
            }
        }, {
            timestamps : true
        },
    ) 
    this.Schema.index({
        patient : 1 ,
        prescriptionDate : -1
    });
    this.Schema.index({
        doctor : 1
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