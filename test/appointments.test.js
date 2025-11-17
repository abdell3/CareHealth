process.env.NODE_ENV = 'test';
process.env.API_VERSION = 'v1';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.APPOINTMENT_QUEUE_KEY = 'queues:appointment-reminders';

const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const RoleModel = require('../src/modules/users/Role');
const UserModel = require('../src/modules/users/User');
const PatientModel = require('../src/modules/patients/Patient');
const AppointmentModel = require('../src/modules/appointments/Appointment');
const AppointmentService = require('../src/modules/appointments/AppointmentService');
const { processReminderJob } = require('../worker/emailWorker');
const { app } = require('../server');

const API_PREFIX = '/api/v1';
const DEFAULT_PASSWORD = 'Password123!';

class RedisMock {
  constructor() {
    this.store = new Map();
    this.lists = new Map();
  }

  async set(key, value, ...options) {
    const isLockCommand = options.includes('NX');
    if (isLockCommand && this.store.has(key)) {
      return null;
    }
    this.store.set(key, value);
    return 'OK';
  }

  async eval(script, keysCount, key, value) {
    if (this.store.get(key) === value) {
      this.store.delete(key);
      return 1;
    }
    return 0;
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
}

const seedRoles = async () => {
  const Role = RoleModel.getModel();
  await Role.deleteMany({});
  await Role.initializeDefaultRoles();
};

const createUser = async ({ firstName, lastName, email, roleName }) => {
  const Role = RoleModel.getModel();
  const targetRole = await Role.findOne({ name: roleName });
  const User = UserModel.getModel();
  const user = new User({
    firstName,
    lastName,
    email,
    password: DEFAULT_PASSWORD,
    role: targetRole._id,
  });
  await user.save();
  return user;
};

const login = async (email) => {
  const res = await request(app)
    .post(`${API_PREFIX}/auth/login`)
    .send({ email, password: DEFAULT_PASSWORD })
    .expect(200);

  return res.body.data.tokens.accessToken;
};

describe('Appointments service', function () {
  this.timeout(20000);
  let mongoServer;
  let adminToken;
  let doctorUser;
  let patientRecord;
  let redisMock;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    await seedRoles();

    const adminUser = await createUser({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      roleName: 'admin',
    });

    doctorUser = await createUser({
      firstName: 'Doc',
      lastName: 'Tor',
      email: 'doctor@example.com',
      roleName: 'doctor',
    });

    const patientUser = await createUser({
      firstName: 'Pat',
      lastName: 'Ient',
      email: 'patient@example.com',
      roleName: 'patient',
    });

    const Patient = PatientModel.getModel();
    patientRecord = await Patient.create({
      firstName: 'Pat',
      lastName: 'Ient',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'other',
      email: 'patient@example.com',
      user: patientUser._id,
    });

    adminToken = await login(adminUser.email);
    redisMock = new RedisMock();
    AppointmentService.setRedisClient(redisMock);
  });

  it('creates an appointment and enqueues a reminder job 24h before', async () => {
    const startTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    await request(app)
      .post(`${API_PREFIX}/appointments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        doctorId: doctorUser._id.toString(),
        patientId: patientRecord._id.toString(),
        startTime,
        duration: 30,
        notes: 'Checkup',
      })
      .expect(201);

    const jobs = await redisMock.lrange(process.env.APPOINTMENT_QUEUE_KEY, 0, -1);
    expect(jobs).to.have.lengthOf(1);

    const job = JSON.parse(jobs[0]);
    expect(job.type).to.equal('appointmentReminder');

    const expectedSendAt = new Date(new Date(startTime).getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(job.sendAt).to.equal(expectedSendAt);
  });

  it('rejects overlapping appointments for the same doctor', async () => {
    const firstStart = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await request(app)
      .post(`${API_PREFIX}/appointments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        doctorId: doctorUser._id.toString(),
        patientId: patientRecord._id.toString(),
        startTime: firstStart,
        duration: 60,
      })
      .expect(201);

    await request(app)
      .post(`${API_PREFIX}/appointments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        doctorId: doctorUser._id.toString(),
        patientId: patientRecord._id.toString(),
        startTime: new Date(new Date(firstStart).getTime() + 15 * 60 * 1000).toISOString(),
        duration: 30,
      })
      .expect(409);
  });

  it('allows only one of two concurrent appointment requests', async () => {
    const payload = {
      doctorId: doctorUser._id.toString(),
      patientId: patientRecord._id.toString(),
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      duration: 30,
    };

    const makeRequest = () =>
      request(app)
        .post(`${API_PREFIX}/appointments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

    const [first, second] = await Promise.all([makeRequest(), makeRequest()]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).to.deep.equal([201, 409]);
  });

  it('processes reminder jobs through the worker stub', async () => {
    const startTime = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();

    const createRes = await request(app)
      .post(`${API_PREFIX}/appointments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        doctorId: doctorUser._id.toString(),
        patientId: patientRecord._id.toString(),
        startTime,
        duration: 30,
      })
      .expect(201);

    const appointmentId = createRes.body.data._id;
    const jobs = await redisMock.lrange(process.env.APPOINTMENT_QUEUE_KEY, 0, -1);
    expect(jobs).to.have.lengthOf(1);

    const job = JSON.parse(jobs[0]);
    job.sendAt = new Date(Date.now() - 1000).toISOString();

    let sentMail = null;
    const mailerStub = {
      sendMail: async (payload) => {
        sentMail = payload;
      },
      close: () => {},
    };

    await processReminderJob(job, { redis: redisMock, mailer: mailerStub });

    const Appointment = AppointmentModel.getModel();
    const storedAppointment = await Appointment.findById(appointmentId);
    expect(storedAppointment.reminderSent).to.be.true;
    expect(sentMail).to.exist;
    expect(sentMail.to).to.equal(patientRecord.email);
  });
});

