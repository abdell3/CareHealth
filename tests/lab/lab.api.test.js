process.env.NODE_ENV = "test";
process.env.API_VERSION = "v1";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-access-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
process.env.JWT_ACCESS_EXPIRES = "15m";
process.env.JWT_REFRESH_EXPIRES = "7d";
process.env.S3_BUCKET_NAME = "test-bucket";
process.env.S3_ENDPOINT = "http://localhost:9000";
process.env.S3_REGION = "us-east-1";
process.env.S3_ACCESS_KEY = "test-key";
process.env.S3_SECRET_KEY = "test-secret";

const { expect } = require("chai");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcrypt");

const { User, Patient, LabOrder, LabResult } = require("../../src/models");
const { app } = require("../../server");
const S3Service = require("../../src/services/S3Service");

const DEFAULT_PASSWORD = "Password123!";
const API_PREFIX = "/api/v1";

let originalUploadFile = null;
let originalGetPresignedUrl = null;

function mockS3Service() {
  originalUploadFile = S3Service.uploadFile;
  originalGetPresignedUrl = S3Service.getPresignedUrl;

  S3Service.uploadFile = async ({ key, buffer, mimeType }) => {
    return {
      key: key || `lab-results/test/${Date.now()}-test.pdf`,
      size: buffer ? buffer.length : 1024,
    };
  };

  S3Service.getPresignedUrl = async (s3Key, expiresSeconds = 600) => {
    return `https://test-bucket.s3.amazonaws.com/${s3Key}?expires=${expiresSeconds}`;
  };
}

function restoreS3Service() {
  if (originalUploadFile) {
    S3Service.uploadFile = originalUploadFile;
  }
  if (originalGetPresignedUrl) {
    S3Service.getPresignedUrl = originalGetPresignedUrl;
  }
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

function createPDFBuffer() {
  const pdfHeader = "%PDF-1.4\n";
  const pdfContent = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const pdfFooter = "%%EOF";
  return Buffer.from(pdfHeader + pdfContent + pdfFooter, "utf-8");
}

describe("Lab API Integration Tests", function () {
  this.timeout(20000);

  let mongoServer;
  let doctorUser;
  let labManagerUser;
  let patientRecord;
  let doctorToken;
  let labManagerToken;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    mockS3Service();
  });

  after(async () => {
    restoreS3Service();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();

    doctorUser = await createUser({
      email: "doctor@example.com",
      roles: ["doctor"],
      profile: {
        firstName: "Doctor",
        lastName: "Smith",
      },
    });

    labManagerUser = await createUser({
      email: "labmanager@example.com",
      roles: ["lab_manager"],
      profile: {
        firstName: "Lab",
        lastName: "Manager",
      },
    });

    patientRecord = await createPatient({
      firstName: "John",
      lastName: "Doe",
      email: "patient@example.com",
      dateOfBirth: "1990-01-01",
      gender: "male",
    });

    doctorToken = await login(doctorUser.email);
    labManagerToken = await login(labManagerUser.email);
  });

  it("test_create_order_success: POST /lab/orders by doctor -> 201, DB contains order with status 'ordered'", async () => {
    const orderData = {
      patientId: patientRecord._id.toString(),
      doctorId: doctorUser._id.toString(),
      tests: [
        { testCode: "CBC", testName: "Complete Blood Count" },
        { testCode: "LIPID", testName: "Lipid Panel" },
      ],
      notes: "Routine checkup",
    };

    const response = await request(app)
      .post(`${API_PREFIX}/lab/orders`)
      .set("Authorization", `Bearer ${doctorToken}`)
      .send(orderData)
      .expect(201);

    expect(response.body.success).to.be.true;
    expect(response.body.data).to.have.property("_id");
    expect(response.body.data.status).to.equal("ordered");
    expect(response.body.data.patientId.toString()).to.equal(patientRecord._id.toString());
    expect(response.body.data.doctorId.toString()).to.equal(doctorUser._id.toString());
    expect(response.body.data.tests).to.have.lengthOf(2);
    expect(response.body.data.tests[0].testCode).to.equal("CBC");
    expect(response.body.data.tests[0].testName).to.equal("Complete Blood Count");

    const order = await LabOrder.findById(response.body.data._id);
    expect(order).to.exist;
    expect(order.status).to.equal("ordered");
    expect(order.requestedAt).to.exist;
  });

  it("test_add_result_success_pdf: simulate lab uploader, POST /lab/orders/:id/results with a small PDF buffer -> 201, DB contains LabResult with s3Key, order.status becomes 'received'", async () => {
    const orderData = {
      patientId: patientRecord._id.toString(),
      doctorId: doctorUser._id.toString(),
      tests: [{ testCode: "CBC", testName: "Complete Blood Count" }],
    };

    const orderResponse = await request(app)
      .post(`${API_PREFIX}/lab/orders`)
      .set("Authorization", `Bearer ${doctorToken}`)
      .send(orderData)
      .expect(201);

    const orderId = orderResponse.body.data._id.toString();
    const pdfBuffer = createPDFBuffer();

    const resultResponse = await request(app)
      .post(`${API_PREFIX}/lab/orders/${orderId}/results`)
      .set("Authorization", `Bearer ${labManagerToken}`)
      .attach("file", pdfBuffer, "test-result.pdf")
      .expect(201);

    expect(resultResponse.body.success).to.be.true;
    expect(resultResponse.body.data).to.have.property("_id");
    expect(resultResponse.body.data).to.have.property("s3Key");
    expect(resultResponse.body.data.s3Key).to.be.a("string");
    expect(resultResponse.body.data.s3Key).to.include("lab-results/");
    expect(resultResponse.body.data.status).to.equal("uploaded");
    expect(resultResponse.body.data.fileName).to.equal("test-result.pdf");
    expect(resultResponse.body.data.mimeType).to.equal("application/pdf");
    expect(resultResponse.body.data.orderId.toString()).to.equal(orderId);

    const result = await LabResult.findById(resultResponse.body.data._id);
    expect(result).to.exist;
    expect(result.s3Key).to.be.a("string");
    expect(result.status).to.equal("uploaded");
    expect(result.uploadedAt).to.exist;

    const updatedOrder = await LabOrder.findById(orderId);
    expect(updatedOrder.status).to.equal("received");
  });

  it("test_add_result_invalid_mime -> attempt to upload .exe or other disallowed -> expect 4xx", async () => {
    const orderData = {
      patientId: patientRecord._id.toString(),
      doctorId: doctorUser._id.toString(),
      tests: [{ testCode: "CBC", testName: "Complete Blood Count" }],
    };

    const orderResponse = await request(app)
      .post(`${API_PREFIX}/lab/orders`)
      .set("Authorization", `Bearer ${doctorToken}`)
      .send(orderData)
      .expect(201);

    const orderId = orderResponse.body.data._id.toString();
    const invalidBuffer = Buffer.from("invalid executable content", "utf-8");

    const invalidResponse = await request(app)
      .post(`${API_PREFIX}/lab/orders/${orderId}/results`)
      .set("Authorization", `Bearer ${labManagerToken}`)
      .attach("file", invalidBuffer, "test.exe")
      .expect(400);

    expect(invalidResponse.body.success).to.be.false;
    expect(invalidResponse.body.message).to.include("Invalid file type");
  });

  it("test_get_presigned_url -> after upload, GET presigned endpoint returns { url } and url is string", async () => {
    const orderData = {
      patientId: patientRecord._id.toString(),
      doctorId: doctorUser._id.toString(),
      tests: [{ testCode: "CBC", testName: "Complete Blood Count" }],
    };

    const orderResponse = await request(app)
      .post(`${API_PREFIX}/lab/orders`)
      .set("Authorization", `Bearer ${doctorToken}`)
      .send(orderData)
      .expect(201);

    const orderId = orderResponse.body.data._id.toString();
    const pdfBuffer = createPDFBuffer();

    const uploadResponse = await request(app)
      .post(`${API_PREFIX}/lab/orders/${orderId}/results`)
      .set("Authorization", `Bearer ${labManagerToken}`)
      .attach("file", pdfBuffer, "test-result.pdf")
      .expect(201);

    const resultId = uploadResponse.body.data._id.toString();

    const presignedResponse = await request(app)
      .get(`${API_PREFIX}/lab/orders/${orderId}/results/${resultId}/presigned`)
      .set("Authorization", `Bearer ${doctorToken}`)
      .expect(200);

    expect(presignedResponse.body.success).to.be.true;
    expect(presignedResponse.body.data).to.have.property("url");
    expect(presignedResponse.body.data.url).to.be.a("string");
    expect(presignedResponse.body.data.url.length).to.be.greaterThan(0);
    expect(presignedResponse.body.data.url).to.include("test-bucket.s3.amazonaws.com");
  });

  it("test_validate_result_by_doctor -> PUT /lab/results/:id/validate by doctor -> status becomes 'validated' and validatedAt set", async () => {
    const orderData = {
      patientId: patientRecord._id.toString(),
      doctorId: doctorUser._id.toString(),
      tests: [{ testCode: "CBC", testName: "Complete Blood Count" }],
    };

    const orderResponse = await request(app)
      .post(`${API_PREFIX}/lab/orders`)
      .set("Authorization", `Bearer ${doctorToken}`)
      .send(orderData)
      .expect(201);

    const orderId = orderResponse.body.data._id.toString();
    const pdfBuffer = createPDFBuffer();

    const uploadResponse = await request(app)
      .post(`${API_PREFIX}/lab/orders/${orderId}/results`)
      .set("Authorization", `Bearer ${labManagerToken}`)
      .attach("file", pdfBuffer, "test-result.pdf")
      .expect(201);

    const resultId = uploadResponse.body.data._id.toString();

    const validateResponse = await request(app)
      .put(`${API_PREFIX}/lab/results/${resultId}/validate`)
      .set("Authorization", `Bearer ${doctorToken}`)
      .expect(200);

    expect(validateResponse.body.success).to.be.true;
    expect(validateResponse.body.data).to.have.property("_id");
    expect(validateResponse.body.data.status).to.equal("validated");
    expect(validateResponse.body.data.validatedAt).to.exist;

    const result = await LabResult.findById(resultId);
    expect(result).to.exist;
    expect(result.status).to.equal("validated");
    expect(result.validatedAt).to.exist;
    expect(result.metadata).to.exist;
    expect(result.metadata.validatedBy).to.exist;
    expect(result.metadata.validatedByRole).to.equal("doctor");
  });
});

