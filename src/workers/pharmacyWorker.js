const redisClient = require("../core/utils/redisClient");
const { connect: connectMongo } = require("../loaders/mongoLoader");
const PrescriptionRepository = require("../repositories/PrescriptionRepository");
const { Patient, Pharmacy } = require("../models");
const emailUtil = require("../core/utils/email");

const QUEUE_KEY = "queue:pharmacy:notifications";
const BRPOP_TIMEOUT = 5;
const MAX_RETRIES = 3;

let isRunning = false;
let mockEmailUtil = null;

function setMockEmailUtil(mock) {
  mockEmailUtil = mock;
}

function getEmailUtil() {
  if (mockEmailUtil) {
    return mockEmailUtil;
  }
  return emailUtil;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getPatientEmail(patientId) {
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return null;
  }

  if (patient.contacts && Array.isArray(patient.contacts)) {
    const emailContact = patient.contacts.find((c) => c.type === "email");
    if (emailContact && emailContact.value) {
      return emailContact.value;
    }
  }

  return null;
}

async function processNotificationJob(job) {
  try {
    const { prescriptionId, pharmacyId, patientId, status, attempts = 0 } = job;

    if (!prescriptionId || !pharmacyId || !patientId || !status) {
      console.error("Malformed job payload:", job);
      return;
    }

    const prescription = await PrescriptionRepository.findById(prescriptionId);

    if (!prescription) {
      console.error(`Prescription ${prescriptionId} not found`);
      return;
    }

    const currentStatus = prescription.status ? prescription.status.toString() : null;

    if (currentStatus !== status) {
      console.log(
        `Prescription ${prescriptionId} status mismatch: expected ${status}, got ${currentStatus}. Ignoring notification to avoid duplicate.`
      );
      return;
    }

    const patientEmail = await getPatientEmail(patientId);

    if (!patientEmail) {
      console.error(`No email found for patient ${patientId}`);
      return;
    }

    const pharmacy = await Pharmacy.findById(pharmacyId);
    const pharmacyName = pharmacy ? pharmacy.name : "Pharmacy";

    let emailSubject = "Prescription Status Update";
    let emailText = "";

    if (status === "dispensed") {
      emailSubject = "Your Prescription is Ready";
      emailText = `Dear Patient,\n\nYour prescription is now ready for pickup at ${pharmacyName}.\n\nPlease bring a valid ID when collecting your medication.\n\nBest regards,\nCareHealth Team`;
    } else if (status === "unavailable") {
      emailSubject = "Prescription Unavailable";
      emailText = `Dear Patient,\n\nWe regret to inform you that your prescription is currently unavailable at ${pharmacyName}.\n\nPlease contact your doctor or the pharmacy for further assistance.\n\nBest regards,\nCareHealth Team`;
    } else if (status === "sent") {
      emailSubject = "Prescription Sent to Pharmacy";
      emailText = `Dear Patient,\n\nYour prescription has been sent to ${pharmacyName}.\n\nYou will be notified when it is ready for pickup.\n\nBest regards,\nCareHealth Team`;
    } else {
      emailSubject = "Prescription Status Update";
      emailText = `Dear Patient,\n\nYour prescription status has been updated to: ${status}.\n\nBest regards,\nCareHealth Team`;
    }

    try {
      const emailService = getEmailUtil();
      await emailService.sendEmail({
        to: patientEmail,
        subject: emailSubject,
        text: emailText,
      });

      console.log(
        `Notification sent successfully for prescription ${prescriptionId} to patient ${patientId} (status: ${status})`
      );
    } catch (emailError) {
      console.error(
        `Failed to send notification for prescription ${prescriptionId}:`,
        emailError.message
      );

      if (attempts >= MAX_RETRIES) {
        console.error(
          `Max retries reached for prescription ${prescriptionId}, dropping job`
        );
        return;
      }

      const retryJob = {
        ...job,
        attempts: attempts + 1,
      };

      await redisClient.rpush(QUEUE_KEY, JSON.stringify(retryJob));
      console.log(
        `Requeued notification job for prescription ${prescriptionId}, attempt ${retryJob.attempts}`
      );
    }
  } catch (error) {
    console.error("Error processing notification job:", error.message);
    if (error.message.includes("connection") || error.message.includes("ECONNREFUSED")) {
      console.error("Connection error detected. Worker may need to reconnect.");
    }
  }
}

async function startWorker() {
  if (isRunning) {
    console.log("Pharmacy worker is already running");
    return;
  }

  try {
    await connectMongo();
    console.log("Pharmacy notification worker started, connected to MongoDB and Redis");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    throw error;
  }

  isRunning = true;

  while (isRunning) {
    try {
      const result = await redisClient.brpop(QUEUE_KEY, BRPOP_TIMEOUT);

      if (!result || result.length < 2) {
        continue;
      }

      const payload = result[1];

      if (!payload) {
        continue;
      }

      let job;
      try {
        job = JSON.parse(payload);
      } catch (parseError) {
        console.error("Failed to parse job payload:", parseError.message);
        continue;
      }

      await processNotificationJob(job);
    } catch (error) {
      if (error.message && error.message.includes("Connection is closed")) {
        console.error("Redis connection closed. Attempting to reconnect...");
        await sleep(5000);
        continue;
      }
      if (error.message && error.message.includes("ECONNREFUSED")) {
        console.error("Redis connection refused. Please ensure Redis is running.");
        await sleep(5000);
        continue;
      }
      console.error("Worker loop error:", error.message);
      await sleep(1000);
    }
  }
}

function stopWorker() {
  isRunning = false;
  console.log("Pharmacy notification worker stopped");
}

if (require.main === module) {
  startWorker().catch((error) => {
    console.error("Fatal error in pharmacy worker:", error);
    process.exit(1);
  });

  process.on("SIGINT", () => {
    console.log("Received SIGINT, stopping worker...");
    stopWorker();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("Received SIGTERM, stopping worker...");
    stopWorker();
    process.exit(0);
  });
}

module.exports = {
  startWorker,
  stopWorker,
  setMockEmailUtil,
};

