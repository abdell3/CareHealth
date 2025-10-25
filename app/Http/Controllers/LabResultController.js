const { validationResult} = require('express-validator');
const LabResultService = require('../../Services/LabResultService');

class LabResultController {
    async create(req, res) {
        try {
            const errors = validationResult(req);
            if(!errors.isEmpty()) {
                return res.status(400).json({
                    success : false,
                    message : 'Validation Invalid',
                    errors : errors.array()
                });
            }
    
            const {patientId, testName, testType, resultDate, results, notes, attachements} = req.body;
            const doctorId = req.user._id;
    
            const labResult = await LabResultService.create({
                patientId, 
                doctorId,
                testName,
                testType,
                resultDate,
                results,
                notes,
                attachements
            });
    
            res.status(201).json({
                success : true,
                message : 'Lab Result Created Successfully',
                data : labResult
            });
        } catch(error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success : false,
                message : error.message
            });
        }
    }

    async getPatientResults(req, res) {
        try {
            const { patientId } = req.params;
            const { status, testType, from, to, page, limit } = req.query;

            const results = await LabResultService.getByPatient(patientId, {
                status,
                testType,
                from,
                to,
                page, 
                limit
            });

            res.json({
                success : true,
                data : results.data,
                meta : results.meta
            })
        }catch(error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success : false, 
                message : error.message
            });
        }
    }

    async getDoctorResult(req, res) {
        try {
            const doctorId = req.user._id;
            const { status, from, to, page, limit } = req.query;
            const results = await LabResultService.getByDoctor(doctorId, {
                status,
                from,
                to,
                page, 
                limit
            });

            res.json({
                success : true,
                data : results.data,
                meta : results.meta
            });
        } catch (error) {
            res.status(500).json({
                success : false,
                message : error.message
            });
        }
    }

    async get(req, res) {
        try {
            const { id } = req.params;
            const result = await LabResultService.get(id);

            res.json({
                success : true,
                data : result
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success : false,
                message : error.message
            });
        }
    }

    async update(req, res) {
        try {
            const errors = validationResult(req);
            if(!errors.isEmpty()) {
                return res.status(400).json({
                    success : false,
                    message : 'Validation Failed',
                    errors : errors.array()
                });
            }

            const { id } = req.params;
            const result = await LabResultService.update(id, req.body);

            res.json({
                succes : true,
                message : 'Lab Result Updated successfully',
                data : result 
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success : false,
                message : error.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await LabResultService.delete(id);

            res.json({
                success : true,
                message : 'Lab Result Deleted Successfully !'
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            error.statu(statusCode).json({
                success : false,
                message : error.message
            });
        }
    }
}


module.exports = new LabResultController();