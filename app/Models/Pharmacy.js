const mongoose = require('mongoose');


class PharmacyModel {
    constructor() {
        this.schema = new mongoose.Schema ({
            name : {
                type : String, 
                required : true,
                trim : true,
            },
            email : {
                type : String, 
                required : true,
                lowercase : true,
                unique : true
            },
            phone : {
                type : String, 
                required : true
            },
            address : {
                street : String, 
                city : String,
                state : String,
                zipCode : String,
                country : String
            },
            coordinate : {
                latitude : Number,
                longitude : Number,
            },
            operatingHours : {
                monday : { open : String, close : String },
                tuesday : { open : String, close : String },
                wednesday : { open : String, close : String },
                thursday : { open : String, close : String },
                friday : { open : String, close : String },
                saturday : { open : String, close : String },
                sunday : { open : String, close : String },
            },
            licenseExpiry : Date,
            manager : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'User',
            },
            staff : [{
                type : mongoose.Schema.Types.ObjectId,
                ref : 'User'
            }],
            isActive : {
                type : Boolean,
                default : true,
            },
        },
        {
            timestamps : true
        },
        )
         this.schema.index({ email : 1 });
         this.schema.index({ licenseNumber : 1 });
         this.schema.index({ isActive : 1 });
    }

    getModel() {
        if (mongoose.models && mongoose.models.Patient) {
          return mongoose.model('Pharmacy');
        }
        return mongoose.model('Pharmacy', this.schema);
      }
}


module.exports = new PharmacyModel();