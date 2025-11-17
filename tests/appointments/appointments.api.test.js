process.env.NODE_ENV = "test";
process.env.API_VERSION = "v1";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-access-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
process.env.JWT_ACCESS_EXPIRES = "15m";
process.env.JWT_REFRESH_EXPIRES = "7d";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";

const { expect } = require("chai");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcrypt");

const { User, Patient, Appointment } = require("../../src/models");
const { app } = require("../../server");

const QUEUE_KEY = "queue:appointments:reminders";
const DEFAULT_PASSWORD = "Password123!";
const API_PREFIX = "/api/v1";

class RedisMock {
  constructor() {
    this.store = new Map();
    this.lists = new Map();
    this.locks = new Map();
  }

  async lpush(key, value) {
    const list = this.lists.get(key) || [];
    list.unshift(value);
    this.lists.set(key, list);
    return list.length;
  }

  async lrange(key, start, stop) {
    const list = this.lists.get(key) || [];
    const adjustedStop = stop === -1 ? list.length - 1 : stop;
    return list.slice(start, adjustedStop + 1);
  }

  async brpop(key, timeout) {
    const list = this.lists.get(key) || [];
    if (list.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, timeout * 1000));
      return null;
    }
    const value = list.pop();
    this.lists.set(key, list);
    return [key, value];
  }

  async lrem(key, count, value) {
    const list = this.lists.get(key) || [];
    let removed = 0;
    for (let i = list.length - 1; i >= 0 && removed < count; i--) {
      if (list[i] === value) {
        list.splice(i, 1);
        removed++;
      }
    }
    this.lists.set(key, list);
    return removed;
  }
}

let redisMock = null;
let originalRedisClient = null;
let originalRedlock = null;

function mockRedis() {
  redisMock = new RedisMock();

  const redisClient = require("../../src/core/utils/redisClient");
  const redlock = require("../../src/core/utils/lock");

  originalRedisClient = redisClient;
  originalRedlock = redlock;

  Object.keys(redisMock).forEach((key) => {
    if (typeof redisMock[key] === "function") {
      redisClient[key] = redisMock[key].bind(redisMock);
    } else {
      redisClient[key] = redisMock[key];
    }
  });

  const mockRedlock = {
    lock: async (key, ttl) => {
      if (redisMock.locks.has(key)) {
        throw new Error("Lock already acquired");
      }
      redisMock.locks.set(key, Date.now() + ttl);
      return {
        unlock: async () => {
          redisMock.locks.delete(key);
        },
      };
    },
  };

  Object.keys(mockRedlock).forEach((key) => {
    redlock[key] = mockRedlock[key];
  });
}

function restoreRedis() {
  if (originalRedisClient && originalRedlock) {
    const redisClient = require("../../src/core/utils/redisClient");
    const redlock = require("../../src/core/utils/lock");
    Object.setPrototypeOf(redisClient, originalRedisClient);
    Object.setPrototypeOf(redlock, originalRedlock);
  }
  redisMock = null;
}

async function createUser({ email, password, roles = ["patient"], profile = {} }) {
  const passwordHash = await bcrypt.hash(password || DEFAULT_PASSWORD, 10);
  const user = new User({
    email,
    passwordHash,
    roles,
    profile,
  });
  await user.save();
  return user;
}

async function createPatient({ firstName, lastName, email, dateOfBirth, gender }) {
  const patient = new Patient({
    firstName,
    lastName,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    gender,
    contacts: email ? [{ type: "email", value: email }] : [],
  });
  await patient.save();
  return patient;
}

async function login(email, password = DEFAULT_PASSWORD) {
  const res = await request(app)
    .post(`${API_PREFIX}/auth/login`)
    .send({ email, password })
    .expect(200);

  return res.body.data.accessToken || res.body.data.tokens?.accessToken;
}

describe("Appointments API Integration Tests", function () {
  this.timeout(20000);

  let mongoServer;
  let doctorUser;
  let patientRecord;
  let authToken;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    mockRedis();
  });

  after(async () => {
    restoreRedis();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    redisMock.lists.clear();
    redisMock.locks.clear();

    doctorUser = await createUser({
      email: "doctor@example.com",
      roles: ["doctor"],
      profile: {
        firstName: "Doctor",
        lastName: "Smith",
      },
    });

    patientRecord = await createPatient({
      firstName: "John",
      lastName: "Doe",
      email: "patient@example.com",
      dateOfBirth: "1990-01-01",
      gender: "male",
    });

    authToken = await login(doctorUser.email);
  });

  it("test_create_appointment_success: creates appointment when no overlap -> expect 201 and DB record", async () => {
    const startAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const endAt = new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString();

    const response = await request(app)
      .post(`${API_PREFIX}/appointments`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        patientId: patientRecord._id.toString(),
        doctorId: doctorUser._id.toString(),
        startAt,
        endAt,
        notes: "Regular checkup",
      })
      .expect(201);

    expect(response.body.success).to.be.true;
    expect(response.body.data).to.have.property("_id");
    expect(response.body.data.patientId.toString()).to.equal(patientRecord._id.toString());
    expect(response.body.data.doctorId.toString()).to.equal(doctorUser._id.toString());
    expect(response.body.data.status).to.equal("scheduled");

    const appointment = await Appointment.findById(response.body.data._id);
    expect(appointment).to.exist;
    expect(appointment.status).to.equal("scheduled");
    expect(appointment.notes).to.equal("Regular checkup");
  });

  it("test_create_appointment_conflict: creates appointment where overlapping exists -> expect 409", async () => {
    const startAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const endAt = new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString();

    await request(app)
      .post(`${API_PREFIX}/appointments`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        patientId: patientRecord._id.toString(),
        doctorId: doctorUser._id.toString(),
        startAt,
        endAt,
      })
      .expect(201);

    const overlappingStartAt = new Date(Date.now() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString();
    const overlappingEndAt = new Date(Date.now() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString();

    const response = await request(app)
      .post(`${API_PREFIX}/appointments`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        patientId: patientRecord._id.toString(),
        doctorId: doctorUser._id.toString(),
        startAt: overlappingStartAt,
        endAt: overlappingEndAt,
      })
      .expect(409);

    expect(response.body.success).to.be.false;
    expect(response.body.message).to.include("overlapping");

    const appointments = await Appointment.find({ doctorId: doctorUser._id });
    expect(appointments).to.have.lengthOf(1);
  });

  it("test_concurrent_creation: simulates two near-concurrent POSTs for same doctor/time -> one 201, one 409", async () => {
    const startAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const endAt = new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString();

    const payload = {
      patientId: patientRecord._id.toString(),
      doctorId: doctorUser._id.toString(),
      startAt,
      endAt,
    };

    const makeRequest = () =>
      request(app)
        .post(`${API_PREFIX}/appointments`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(payload);

    const [first, second] = await Promise.all([makeRequest(), makeRequest()]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).to.deep.equal([201, 409]);

    const appointments = await Appointment.find({ doctorId: doctorUser._id });
    expect(appointments).to.have.lengthOf(1);
  });

  it("test_reminder_enqueued: after creating appointment, check Redis list contains job with sendAt = startAt - 24h", async () => {
    const startAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);

    const response = await request(app)
      .post(`${API_PREFIX}/appointments`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        patientId: patientRecord._id.toString(),
        doctorId: doctorUser._id.toString(),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      })
      .expect(201);

    const jobs = await redisMock.lrange(QUEUE_KEY, 0, -1);
    expect(jobs).to.have.lengthOf(1);

    const job = JSON.parse(jobs[0]);
    expect(job.type).to.equal("appointmentReminder");
    expect(job.appointmentId).to.equal(response.body.data._id.toString());
    expect(job.patientId).to.equal(patientRecord._id.toString());
    expect(job.doctorId).to.equal(doctorUser._id.toString());

    const expectedSendAt = startAt.getTime() - 24 * 3600 * 1000;
    expect(job.sendAt).to.equal(expectedSendAt);
  });
});

