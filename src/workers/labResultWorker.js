const redisClient = require("../core/utils/redisClient");
const { connect: connectMongo } = require("../loaders/mongoLoader");
const LabResultRepository = require("../repositories/LabResultRepository");
const LabOrderRepository = require("../repositories/LabOrderRepository");
const { Patient, User } = require("../models");
const emailUtil = require("../core/utils/email");

const QUEUE_KEY = "queue:lab:results";
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

async function getDoctorEmail(doctorId) {
  const doctor = await User.findById(doctorId);
  if (!doctor) {
    return null;
  }

  return doctor.email || null;
}

async function processNotificationJob(job) {
  try {
    const { resultId, orderId, patientId, doctorId, attempts = 0 } = job;

    if (!resultId || !orderId || !patientId || !doctorId) {
      console.error("Malformed job payload: missing required fields", job);
      return;
    }

    if (attempts >= MAX_RETRIES) {
      console.error(`Job for result ${resultId} exceeded max retries (${MAX_RETRIES}). Dropping job.`);
      return;
    }

    const result = await LabResultRepository.findById(resultId);

    if (!result) {
      console.error(`Lab result ${resultId} not found`);
      return;
    }

    const currentStatus = result.status ? result.status.toString() : null;

    if (currentStatus !== "uploaded") {
      console.log(
        `Lab result ${resultId} status is '${currentStatus}', not 'uploaded'. Skipping notification.`
      );
      return;
    }

    const metadata = result.metadata || {};
    if (metadata.notified === true) {
      console.log(`Lab result ${resultId} already notified. Skipping duplicate notification.`);
      return;
    }

    const order = await LabOrderRepository.findById(orderId);
    if (!order) {
      console.error(`Lab order ${orderId} not found for result ${resultId}`);
      return;
    }

    const patientEmail = await getPatientEmail(patientId);
    const doctorEmail = await getDoctorEmail(doctorId);

    if (!patientEmail && !doctorEmail) {
      console.error(`No email found for patient ${patientId} or doctor ${doctorId}`);
      return;
    }

    const patient = await Patient.findById(patientId);
    const patientName = patient ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim() : "Patient";

    const emailSubject = "Lab Results Available";
    const emailText = `Dear ${patientName},\n\nYour lab results have been uploaded and are now available for review.\n\nPlease log in to your account to view the results.\n\nBest regards,\nCareHealth Team`;

    const emailHtml = `<p>Dear ${patientName},</p><p>Your lab results have been uploaded and are now available for review.</p><p>Please log in to your account to view the results.</p><p>Best regards,<br>CareHealth Team</p>`;

    const emailsToSend = [];

    if (patientEmail) {
      emailsToSend.push({
        to: patientEmail,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });
    }

    if (doctorEmail) {
      const doctorSubject = "New Lab Results Available for Review";
      const doctorText = `Dear Doctor,\n\nLab results have been uploaded for patient ${patientName} (Order ID: ${orderId}).\n\nPlease review the results at your earliest convenience.\n\nBest regards,\nCareHealth Team`;

      const doctorHtml = `<p>Dear Doctor,</p><p>Lab results have been uploaded for patient ${patientName} (Order ID: ${orderId}).</p><p>Please review the results at your earliest convenience.</p><p>Best regards,<br>CareHealth Team</p>`;

      emailsToSend.push({
        to: doctorEmail,
        subject: doctorSubject,
        text: doctorText,
        html: doctorHtml,
      });
    }

    try {
      const emailService = getEmailUtil();

      for (const emailData of emailsToSend) {
        await emailService.sendEmail(emailData);
        console.log(`Notification email sent successfully to ${emailData.to} for result ${resultId}`);
      }

      await LabResultRepository.updateResult(resultId, {
        metadata: {
          ...metadata,
          notified: true,
          notifiedAt: new Date(),
        },
      });

      console.log(`Successfully processed notification job for result ${resultId}`);
    } catch (emailError) {
      console.error(`Failed to send notification emails for result ${resultId}:`, emailError.message);

      if (attempts < MAX_RETRIES) {
        const retryJob = {
          ...job,
          attempts: attempts + 1,
        };

        await redisClient.lpush(QUEUE_KEY, JSON.stringify(retryJob));
        console.log(`Requeued job for result ${resultId} (attempt ${attempts + 1}/${MAX_RETRIES})`);
      } else {
        console.error(`Max retries reached for result ${resultId}. Job dropped.`);
      }

      throw emailError;
    }
  } catch (error) {
    console.error("Error processing notification job:", error.message);
    if (error.message && (error.message.includes("connection") || error.message.includes("ECONNREFUSED"))) {
      console.error("Connection error detected. Worker may need to reconnect.");
    }
  }
}

async function startWorker() {
  if (isRunning) {
    console.log("Lab result worker is already running");
    return;
  }

  try {
    await connectMongo();
    console.log("Lab result notification worker started, connected to MongoDB and Redis");
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
        await sleep(1000);
        continue;
      }

      console.error("Unexpected error in worker loop:", error.message);
      await sleep(1000);
    }
  }
}

function stopWorker() {
  isRunning = false;
  console.log("Lab result worker stopped");
}

process.on("SIGINT", () => {
  console.log("Received SIGINT, stopping lab result worker...");
  stopWorker();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, stopping lab result worker...");
  stopWorker();
  process.exit(0);
});

if (require.main === module) {
  startWorker().catch((error) => {
    console.error("Failed to start lab result worker:", error);
    process.exit(1);
  });
}

module.exports = {
  startWorker,
  stopWorker,
  setMockEmailUtil,
};

