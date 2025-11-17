const redisClient = require("../core/utils/redisClient");
const { connect: connectMongo } = require("../loaders/mongoLoader");
const { Appointment, Patient } = require("../models");
const emailUtil = require("../core/utils/email");

const QUEUE_KEY = "queue:appointments:reminders";
const BRPOP_TIMEOUT = 5;
const SLEEP_MS = 1000;
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

async function processReminderJob(job) {
  try {
    const { appointmentId, patientId, doctorId, sendAt, attempts = 0 } = job;

    if (!appointmentId || !patientId || !doctorId || sendAt === undefined) {
      console.error("Malformed job payload:", job);
      return;
    }

    const sendAtMs = typeof sendAt === "number" ? sendAt : new Date(sendAt).getTime();
    const now = Date.now();

    if (sendAtMs > now) {
      await redisClient.rpush(QUEUE_KEY, JSON.stringify(job));
      await sleep(SLEEP_MS);
      return;
    }

    const appointment = await Appointment.findById(appointmentId).populate("doctorId", "profile");

    if (!appointment) {
      console.error(`Appointment ${appointmentId} not found`);
      return;
    }

    if (appointment.status !== "scheduled") {
      console.log(`Appointment ${appointmentId} is not scheduled (status: ${appointment.status}), ignoring reminder`);
      return;
    }

    const patientEmail = await getPatientEmail(patientId);

    if (!patientEmail) {
      console.error(`No email found for patient ${patientId}`);
      return;
    }

    const doctor = appointment.doctorId;
    const doctorName = doctor && doctor.profile
      ? `${doctor.profile.firstName || ""} ${doctor.profile.lastName || ""}`.trim()
      : "Doctor";

    const appointmentDate = new Date(appointment.startAt).toLocaleString();

    const emailSubject = "Appointment Reminder";
    const emailText = `Dear Patient,\n\nThis is a reminder that you have an appointment scheduled with ${doctorName} on ${appointmentDate}.\n\nPlease arrive on time.\n\nBest regards,\nCareHealth Team`;

    try {
      const emailService = getEmailUtil();
      await emailService.sendEmail({
        to: patientEmail,
        subject: emailSubject,
        text: emailText,
      });

      console.log(`Reminder sent successfully for appointment ${appointmentId} to ${patientEmail}`);
    } catch (emailError) {
      console.error(`Failed to send reminder for appointment ${appointmentId}:`, emailError.message);

      if (attempts >= MAX_RETRIES) {
        console.error(`Max retries reached for appointment ${appointmentId}, dropping job`);
        return;
      }

      const retryJob = {
        ...job,
        attempts: attempts + 1,
      };

      await redisClient.rpush(QUEUE_KEY, JSON.stringify(retryJob));
      console.log(`Requeued reminder job for appointment ${appointmentId}, attempt ${retryJob.attempts}`);
    }
  } catch (error) {
    console.error("Error processing reminder job:", error.message);
    if (error.message.includes("connection") || error.message.includes("ECONNREFUSED")) {
      console.error("Connection error detected. Worker may need to reconnect.");
    }
  }
}

async function startWorker() {
  if (isRunning) {
    console.log("Worker is already running");
    return;
  }

  try {
    await connectMongo();
    console.log("Reminder worker started, connected to MongoDB and Redis");
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

      await processReminderJob(job);
    } catch (error) {
      if (error.message && error.message.includes("Connection is closed")) {
        console.error("Redis connection closed. Attempting to reconnect...");
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
  console.log("Reminder worker stopped");
}

if (require.main === module) {
  startWorker().catch((error) => {
    console.error("Fatal error in reminder worker:", error);
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

