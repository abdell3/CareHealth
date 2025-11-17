const { validationResult } = require("express-validator");
const PharmacyService = require("./PharmacyService");

class PharmacyController {
    async create(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: errors.array(),
                });
            }

            const pharmacy = await PharmacyService.create(req.body);

            res.status(201).json({
                success: true,
                message: "Pharmacy created successfully",
                data: pharmacy,
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                message: error.message,
            });
        }
    }
    
    async getAll(req, res) {
        try {
            const { page, limit, isVerified } = req.query;
            const filters = { page, limit };
            if (typeof isVerified !== "undefined") {
                filters.isVerified = isVerified === "true";
            }
            const pharmacies = await PharmacyService.getAll(filters);

            res.json({
                success: true,
                data: pharmacies.data,
                meta: pharmacies.meta,
            });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const pharmacy = await PharmacyService.getById(id);
            res.json({
                success: true,
                data: pharmacy,
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                message: error.message,
            });
        }
    }

    async update(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: errors.array(),
                });
            }

            const { id } = req.params;
            const pharmacy = await PharmacyService.update(id, req.body);

            res.json({
                success: true,
                message: "Pharmacy updated successfully",
                data: pharmacy,
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                message: error.message,
            });
        }
    }

    async addStaff(req, res) {
        try {
            const { id } = req.params;
            const { staffId } = req.body;
            const pharmacy = await PharmacyService.addStaff(id, staffId);

            res.json({
                success: true,
                message: "Staff member added successfully",
                data: pharmacy,
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                message: error.message,
            });
        }
    }

    async removeStaff(req, res) {
        try {
            const { id } = req.params;
            const { staffId } = req.body;
            const pharmacy = await PharmacyService.removeStaff(id, staffId);
            res.json({
                success: true,
                message: "Staff member removed successfully",
                data: pharmacy,
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                message: error.message,
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await PharmacyService.delete(id);
            res.json({
                success: true,
                message: "Pharmacy deleted successfully",
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                message: error.message,
            });
        }
    }
}

module.exports = new PharmacyController()
