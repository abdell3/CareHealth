import { Router } from "express";

const router = Router();

router.use("/auth", require("./auth"));
router.use("/patients", require("./patients"));
router.use("/", require("./appointmentsRoutes"));
router.use("/documents", require("./medicalDocuments"));
router.use("/lab", require("./lab"));
router.use("/", require("./consultationsRoutes"));

export = router;


