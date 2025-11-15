require("dotenv").config();
const Redis = require("ioredis");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const database = require("../config/database");
const AppointmentModel = require("../app/Models/Appointment");

const Appointment = AppointmentModel.getModel();
const QUEUE_KEY = process.env.APPOINTMENT_QUEUE_KEY || "queues:appointment-reminders";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createRedisClient = () =>
  new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT || 6379),
  });

const createMailer = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT || 587) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

async function startWorker() {
  await database.connect();
  const redis = createRedisClient();
  const mailer = createMailer();

  console.log("Email worker started");

  while (true) {
    try {
      const [, payload] = await redis.brpop(QUEUE_KEY, 0);
      if (!payload) {
        continue;
      }

      const job = JSON.parse(payload);
      await processReminderJob(job, { redis, mailer });
    } catch (error) {
      console.error("Worker error", error);
      await sleep(1000);
    }
  }
}

async function processReminderJob(job, deps = {}) {
  if (!job || job.type !== "appointmentReminder") {
    return;
  }

  const redisClient = deps.redis || createRedisClient();
  const mailer = deps.mailer || createMailer();

  const sendAtMs = new Date(job.sendAt || new Date()).getTime();
  if (sendAtMs > Date.now()) {
    await sleep(sendAtMs - Date.now());
  }

  try {
    const appointment = await Appointment.findById(job.appointmentId)
      .populate({
        path: "patient",
        populate: { path: "user", select: "email" },
      })
      .populate({
        path: "doctor",
        select: "firstName lastName email",
      });

    if (!appointment) {
      return;
    }
    if (appointment.reminderSent) {
      return;
    }

    const patientRecord = appointment.patient;
    const patientEmail = patientRecord?.email || patientRecord?.user?.email;
    if (!patientEmail) {
      return;
    }

    const doctor = appointment.doctor;
    await mailer.sendMail({
      from: process.env.EMAIL_FROM || doctor?.email || process.env.EMAIL_USER,
      to: patientEmail,
      subject: "Appointment reminder",
      text: `Dear ${patientRecord?.firstName || "patient"}, this is a reminder that you have an appointment scheduled on ${new Date(
        appointment.startTime,
      ).toLocaleString()}.`,
    });

    appointment.reminderSent = true;
    appointment.reminderSentAt = new Date();
    await appointment.save();
  } catch (error) {
    console.error("Reminder processing error", error);
    if (!redisClient) {
      return;
    }
    const attempts = (job.attempts || 0) + 1;
    if (attempts >= 3) {
      return;
    }
    const retryJob = {
      ...job,
      attempts,
    };
    await redisClient.lpush(QUEUE_KEY, JSON.stringify(retryJob));
  } finally {
    if (!deps.redis) {
      redisClient.disconnect();
    }
    if (!deps.mailer) {
      mailer.close?.();
    }
  }
}

if (require.main === module) {
  startWorker().catch((error) => {
    console.error("Worker failed to start", error);
    mongoose.connection.close();
    process.exit(1);
  });
}

module.exports = { startWorker, processReminderJob };

