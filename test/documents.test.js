process.env.NODE_ENV = 'test';
process.env.API_VERSION = 'v1';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.S3_ENDPOINT = 'http://localhost:9000';

const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const RoleModel = require('../src/modules/users/Role');
const UserModel = require('../src/modules/users/User');
const PatientModel = require('../src/modules/patients/Patient');
const MedicalDocumentModel = require('../src/modules/documents/MedicalDocument');
const S3Service = require('../src/modules/documents/S3Service');
const { app } = require('../server');

const API_PREFIX = '/api/v1';
const DOCS_PREFIX = '/api/v1/medical-documents';
const DEFAULT_PASSWORD = 'Password123!';

const seedRoles = async () => {
  const Role = RoleModel.getModel();
  await Role.deleteMany({});
  await Role.initializeDefaultRoles();
};

const createDoctorUser = async () => {
  const Role = RoleModel.getModel();
  const doctorRole = await Role.findOne({ name: 'doctor' });
  const User = UserModel.getModel();
  const doctor = new User({
    firstName: 'Doc',
    lastName: 'Tor',
    email: 'doctor@example.com',
    password: DEFAULT_PASSWORD,
    role: doctorRole._id,
  });
  await doctor.save();
  return doctor;
};

const login = async (email) => {
  const res = await request(app)
    .post(`${API_PREFIX}/auth/login`)
    .send({ email, password: DEFAULT_PASSWORD })
    .expect(200);
  return res.body.data.tokens.accessToken;
};

describe('Medical documents', function () {
  this.timeout(20000);
  let mongoServer;
  let doctorToken;
  let patientToken;
  let patientRecord;
  let uploadStub;
  let getUrlStub;
  let deleteStub;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    uploadStub = S3Service.uploadFile;
    getUrlStub = S3Service.getPresignedUrl;
    deleteStub = S3Service.deleteFile;

    S3Service.uploadFile = async ({ patientId, fileName }) => ({
      key: `${patientId}/fake-${fileName}`,
    });
    S3Service.getPresignedUrl = async () => 'https://example.com/presigned';
    S3Service.deleteFile = async () => true;
  });

  after(async () => {
    S3Service.uploadFile = uploadStub;
    S3Service.getPresignedUrl = getUrlStub;
    S3Service.deleteFile = deleteStub;
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    await seedRoles();

    const doctor = await createDoctorUser();
    doctorToken = await login(doctor.email);

    const registerRes = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({
        firstName: 'Patient',
        lastName: 'User',
        email: 'patient@example.com',
        password: DEFAULT_PASSWORD,
        phone: '+1111111111',
        gender: 'other',
        dateOfBirth: '1990-01-01',
      })
      .expect(201);

    patientToken = registerRes.body.data.tokens.accessToken;

    const Patient = PatientModel.getModel();
    patientRecord = await Patient.findOne({ email: 'patient@example.com' });
  });

  const uploadDocument = async (overrides = {}) => {
    const buffer = overrides.buffer || Buffer.from('%PDF test');
    const response = await request(app)
      .post(`${DOCS_PREFIX}/upload`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .field('patientId', patientRecord._id.toString())
      .field('category', 'report')
      .field('description', 'test doc')
      .attach('file', buffer, {
        filename: overrides.filename || 'report.pdf',
        contentType: overrides.mimeType || 'application/pdf',
      });
    return response;
  };

  it('uploads a medical document and stores the S3 key', async () => {
    const res = await uploadDocument();
    expect(res.status).to.equal(201);
    const docId = res.body.data._id;
    expect(res.body.data.s3Key).to.be.a('string');

    const MedicalDocument = MedicalDocumentModel.getModel();
    const stored = await MedicalDocument.findById(docId);
    expect(stored).to.exist;
    expect(stored.s3Key).to.equal(res.body.data.s3Key);
  });

  it('returns a presigned URL for the patient route', async () => {
    const uploadRes = await uploadDocument();
    const docId = uploadRes.body.data._id;

    const res = await request(app)
      .get(`${API_PREFIX}/patients/${patientRecord._id}/documents/${docId}/presigned`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(res.body.data.url).to.equal('https://example.com/presigned');
  });

  it('rejects files larger than 20MB', async () => {
    const largeBuffer = Buffer.alloc(21 * 1024 * 1024, 'a');
    const res = await uploadDocument({ buffer: largeBuffer });
    expect(res.status).to.equal(400);
    expect(res.body.message).to.match(/File size exceeds/i);
  });
});

