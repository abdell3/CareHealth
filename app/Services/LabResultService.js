const LabResultRepository = require('../Repositories/LabResultRepository');
const PatientRepository = require('../Repositories/PatientRepository');
const UserRepository = require('../Repositories/UserRepository')

class LabResultService {
    
    async create({patientId, doctorId, testName, testType, resultDate, results, notes, attachements}) {
        const patient = await PatientRepository.findById(patientId);
        if(!patient) {
            const err = new Error('Patien Not Found !');
            err.statusCode = 404;
            throw err ;
        }

        const doctor = await UserRepository.findById(doctorId);
        if(!doctor) {
            const err = new Error('Doctor Not Found');
            err.statusCode = 404;
            throw err ;
        }

        const labResult = await LabResultRepository.create({
            patient : patientId,
            doctor : doctorId,
            testName,
            testType,
            resultDate,
            results,
            notes,
            attachements,
            status : resultDate ? 'Completed' : 'Pending'
        });

        return labResult;
    }

    async getPatient(patientId, filters = {}) {
        return await LabResultRepository.findByPatient(patientId, filters);
    }

    async getDoctor(doctorId, filters = {}) {
        return await LabResultRepository.findByDoctor(doctorId, filters);
    }

    async get(id) {
        const labResult = await LabResultRepository.findById(id);
        if(!labResult) {
            const err = new Error('LabResult Not Found');
            err.statusCode = 404;
            throw err;
        }
        
        return labResult;
    }

    async update(id, data) {
        const labResult = await LabResultRepository.findById(id);
        if(!labResult) {
            const err = new Error('LabResult Not Found');
            err.statusCode = 404;
            throw err;
        }

        return await LabResultRepository.update(id, data);
    }

    async delete(id) {
        const labResult = await LabResultRepository.findById(id)
        if (!labResult) {
            const err = new Error("Lab result not found")
            err.statusCode = 404
            throw err
        }
        return LabResultRepository.delete(id)
    } 
}

module.exports = new LabResultService();