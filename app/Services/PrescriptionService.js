const PrescriptionRepository = require('../Repositories/PrescriptionRepository');
const PatientRepository = require('../Repositories/PatientRepository');
const UserRepository = require('../Repositories/UserRepository');

class PrescriptionService {
    
    async create({ patientId, doctorId, medicalRecordId, medications, expireDate, notes }) {
        const patient = await PatientRepository.findById(patientId);
        if(!patient) {
            const err = new Error('Patient Not Found !');
            err.statusCode = 404;
            return err;
        }

        const doctor = await UserRepository.findById(doctorId);
        if(!doctor) {
            const err = new Error('Doctor Not Found !');
            err.statusCode = 404;
            throw err;
        }

        if(!medications || medications.length === 0) {
            const err = new Error('one medication at least !');
            err.statusCode = 400;
            throw err;
        }

        const prescription = await PrescriptionRepository.create({
            patientId, doctorId, medicalRecordId, medications, expireDate, notes
        }) ;
        
        return prescription;
    }

    async getByPatient(patientId, filters = {}) {
        return PrescriptionRepository.findByPatient(patientId, filters);
    }

    async getByDoctor(doctorId, filters = {}){
        return PrescriptionRepository.findByDoctor(doctorId, filters);
    }

    async getById(id) {
        const prescription = await PrescriptionRepository.findById(id);

        if(!prescription) {
            const err = new Error('Prescription Not Found ');
            err.statusCode = 404;
            throw err;
        }

        return prescription ;
    }

    async update(id, data) {
        const prescription = await PrescriptionRepository.findById(id);

        if(!prescription) {
            const err = new Error('Prescription Not Found');
            err.statusCode = 404;
        }

        const updatedPrescription = await PrescriptionRepository.update(id, data);
        return updatedPrescription;
    }

    async delete(id) {
        const prescription = await PrescriptionRepository.findById(id);
        if(!prescription) {
            const err = new Error('Can\'t find the prescription !');
            err.statusCode = 404;
            throw err ;
        }
        
        const deletedPrescription = await PrescriptionRepository.delete(id);
        return deletedPrescription;
    }
}


module.exports = new PrescriptionService();