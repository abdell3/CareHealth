const LabResultModel = require('./LabResult');

class LabResultRepository {
    constructor() {
        this.LabResultModel = LabResultModel.getModel();
    }

    async create(data) {
        const doc = new this.LabResultModel(data);
        return doc.save();
    }

    async findById(id) {
        return this.LabResultModel.findById(id)
            .populate('patient', 'firstName lastName')
            .populate('doctor', 'firstName lastName email') ;
    }

    async findByPatient(patientId, filters = {}) {
        const query = { patient : patientId };

        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.testType) {
            query.testType = filters.testType;
        }
        if (filters.from || filters.to) {
            query.orderDate = {}
            if (filters.from) {
                query.orderDate.$gte = new Date(filters.from);
            }
            if (filters.to) {
                query.orderDate.$lte = new Date(filters.to);
            }
        }

        const page = Math.max(Number.parseInt(filters.page) || 1, 1);
        const limit = Math.min(Number.parseInt(filters.limit) || 50, 200);
        const skip = (page - 1) * limit;

        const docs = await this.App.find(query)
            .populate("doctor", "firstName lastName")
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit);

        const total = await this.App.countDocuments(query);
        return { data: docs, meta: { page, limit, total } };
    }

    async findByDoctor(doctorId, filters = {}) {
        const query = { doctor: doctorId };

        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.from || filters.to) {
            query.orderDate = {};
            if (filters.from) {
                query.orderDate.$gte = new Date(filters.from);
            }
            if (filters.to) {
                query.orderDate.$lte = new Date(filters.to);
            }
        }

        const page = Math.max(Number.parseInt(filters.page) || 1, 1);
        const limit = Math.min(Number.parseInt(filters.limit) || 50, 200);
        const skip = (page - 1) * limit;

        const docs = await this.App.find(query)
            .populate("patient", "firstName lastName")
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit);

        const total = await this.App.countDocuments(query);
        return { data: docs, meta: { page, limit, total } };
    }

    async update(id, data) {
        return this.LabResultModel.findByIdAndUpdate(id, data, { new : true })
            .populate('patient', 'firstName lastName')
            .populate('doctor', 'firstName lastName');
    }

    async delete(id) {
        return this.LabResultModel.findByIdAndDelete(id);
    }
}

module.exports = new LabResultRepository();

