const PrescriptionModel = require('../Models/Prescription');

class PrescriptionRepository {
    constructor() {
        this.Prescription = PrescriptionModel.getModel();
    }

    async create(data) {
        const doc = new this.Prescription(data);
        return doc.save();
    }

    async findById(id) {
        return this.Prescription.findById(id)
        .populate('atient', 'firstName lastName')
        .populate('doctor', 'firstName lastName email')
        .populate('medicalRecord');
    }

    async findByPatient(patientId, filters = {}) {
        const query = { patient : patientId};

        if(fileters.status){
            query.status = filters.status;
        }

        if(filters.from || filters.to){
            query.prescriptionDate = {};
            if(filters.from) {
                query.prescriptionDate.$gte = new Date(filters.from);
            }
            if(filters.to) {
                query.prescription.$lte = new Date(filters.to);
            }
        }

        const page = Math.max(Number.parseInt(filters.page) || 1, 1);
        const limit = Math.min(Number.parseInt(filters.limit) || 50, 200);
        const skip = (page - 1) * limit ;

        const docs = await this.Prescription.find(query)
            .populate('doctor', 'firstName lastName')
            .sort({prescriptiondDate : - 1})
            .skip(skip)
            .limit(limit);
        
        const total = await this.Prescription.countDocuments(query);
        return {
            data : docs,
            page : { page, limit, total}
        }
    }

    async findByDoctor(doctorId, filters = {}) {
        const query = { doctor : doctorId };

        if(filters.from || filters.to) {
            query.prescription = {};
            if(filters.from) {
                query.prescriptionDate.$gte = new Date(filters.from); 
            }
            if(filters.to) {
                query.prescription.$lte = new Date(filters.to);
            }
        }

        const page = Math.max(Number.parseInt(filters.page) || 1, 1);
        const limit = Math.min(Number.parseInt(filters.limit) || 50, 200);
        const skip = (page - 1) * limit ;

        const docs = await this.Prescription.find(query)
            .populate('patient', 'firstName lastName')
            .sort({ prescriptionDate : -1 })
            .skip(skip)
            .limit(limit);

        const total = await this.Prescription.countDocuments(query);
        return {
            data : docs,
            page : { page, limit, total }
        }
    }

    async update(id, data) {
        return this.Prescription.findByIdAndUpdate(id, data, { new : true})
            .populate('patient', 'firstName lastName')
            .populate('doctor', 'firstName lastName');
    }

    async delete(id) {
        return this.Prescription.findByIdAndDelete(id);
    }
}


module.exports = new PrescriptionRepository();