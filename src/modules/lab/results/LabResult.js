const mongoose = require('mongoose');

class LabResultModel {
    constructor() {
        this.schema = new mongoose.Schema({
            patient : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'Patient',
                required : true,
            },
            doctor : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'User',
                required : true
            },
            testName : {
                type : String,
                required : true,
                trim : true
            },
            testType : {
                type : String,
                enum : ['blood', 'urine', 'imaging', 'other'],
                required : true,
            },
            orderDate : {
                type : Date,
                default : Date.now,
            },
            resultDate : Date,
            status : {
                type : String,
                enum : ['Pending', 'Completed', 'Cancelled'],
                default : 'Pending',
            },
            results : {
                value : String,
                unit : String,
                referenceRange : String, 
                normalRange : String,
            },
            notes : {
                type : String,
                trim : true
            },
            attachements : [String],
        },{
            timestamps : true
            },
        );

        this.schema.index({ parient : 1, orderDate : -1 });
        this.schema.index({ doctor : 1 });
        this.schema.index({ status : 1 })
    }

    getModel() {
        if(mongoose.models && mongoose.models.LabResult) {
            return mongoose.model('LabResult');
        }
        return mongoose.model('LabResult', this.schema);
    }
}



module.exports = new LabResultModel();