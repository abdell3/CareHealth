const PrescriptionRepository = require('./PrescriptionRepository');
const PatientRepository = require('../patients/PatientRepository');
const UserRepository = require('../users/UserRepository');

class PrescriptionService {
    async create({ patientId, doctorId, medicalRecordId, medications, expiryDate, notes }) {
        const patient = await PatientRepository.findById(patientId);
        if(!patient) {
            const err = new Error('Patient Not Found !');
            err.statusCode = 404;
            throw err;
        }

        const doctor = await UserRepository.findById(doctorId);
        if(!doctor || doctor.role.name !== "doctor") {
            const err = new Error('Doctor Not Found or Invalid!');
            err.statusCode = 404;
            throw err;
        }

        if(!medications || medications.length === 0) {
            const err = new Error('one medication at least !');
            err.statusCode = 400;
            throw err;
        }

        const formattedMedications = medications.map(item => ({
            name: item.name,
            dosage: item.dosage,
            frequence: item.frequency,
            duration: item.duration || '',
            instruction: item.instructions,
            route: item.route || 'oral'
        }));

        const prescription = await PrescriptionRepository.create({
            patient: patientId,
            doctor: doctorId,
            medicalRecord: medicalRecordId,
            medication: formattedMedications,
            expireyDate: expiryDate,
            notes
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

        const updatePayload = { ...data };

        if(updatePayload.medications) {
            updatePayload.medication = updatePayload.medications.map(item => ({
                name: item.name,
                dosage: item.dosage,
                frequence: item.frequency,
                duration: item.duration || '',
                instruction: item.instructions,
                route: item.route || 'oral'
            }));
            delete updatePayload.medications;
        }

        if(updatePayload.expiryDate) {
            updatePayload.expireyDate = updatePayload.expiryDate;
            delete updatePayload.expiryDate;
        }

        const updatedPrescription = await PrescriptionRepository.update(id, updatePayload);
        return updatedPrescription;
    }

    async delete(id) {
        const prescription = await PrescriptionRepository.findById(id);
        if(!prescription) {
            const err = new Error('Can\'t find the prescription !');
            err.statusCode = 404;
            throw err ;
        }
        
        return PrescriptionRepository.delete(id);
    }
}


module.exports = new PrescriptionService();