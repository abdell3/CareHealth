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

const { User, Patient, MedicalDocument } = require("../../src/models");
const { app } = require("../../server");
const S3Service = require("../../src/services/S3Service");

const DEFAULT_PASSWORD = "Password123!";
const API_PREFIX = "/api/v1";

let originalUploadFile = null;
let originalGetPresignedUrl = null;
let originalDeleteFile = null;

function mockS3Service() {
  originalUploadFile = S3Service.uploadFile;
  originalGetPresignedUrl = S3Service.getPresignedUrl;
  originalDeleteFile = S3Service.deleteFile;

  S3Service.uploadFile = async ({ key, buffer, mimeType }) => {
    return {
      key: key || `documents/test/${Date.now()}-test.pdf`,
      size: buffer ? buffer.length : 1024,
    };
  };

  S3Service.getPresignedUrl = async (s3Key, expiresSeconds = 600) => {
    return `https://test-bucket.s3.amazonaws.com/${s3Key}?expires=${expiresSeconds}`;
  };

  S3Service.deleteFile = async (key) => {
    return { success: true };
  };
}

function restoreS3Service() {
  if (originalUploadFile) {
    S3Service.uploadFile = originalUploadFile;
  }
  if (originalGetPresignedUrl) {
    S3Service.getPresignedUrl = originalGetPresignedUrl;
  }
  if (originalDeleteFile) {
    S3Service.deleteFile = originalDeleteFile;
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

function createLargeBuffer(sizeInBytes) {
  return Buffer.alloc(sizeInBytes, "a");
}

describe("Medical Documents API Integration Tests", function () {
  this.timeout(20000);

  let mongoServer;
  let doctorUser;
  let patientRecord;
  let authToken;

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

    patientRecord = await createPatient({
      firstName: "John",
      lastName: "Doe",
      email: "patient@example.com",
      dateOfBirth: "1990-01-01",
      gender: "male",
    });

    authToken = await login(doctorUser.email);
  });

  it("test_upload_document_success: simulate authenticated uploader, call POST /patients/:id/documents with a small PDF buffer, assert 201 and DB metadata (s3Key present)", async () => {
    const pdfBuffer = createPDFBuffer();

    const response = await request(app)
      .post(`${API_PREFIX}/patients/${patientRecord._id.toString()}/documents`)
      .set("Authorization", `Bearer ${authToken}`)
      .attach("file", pdfBuffer, "test-document.pdf")
      .field("category", "report")
      .expect(201);

    expect(response.body.success).to.be.true;
    expect(response.body.data).to.have.property("_id");
    expect(response.body.data).to.have.property("s3Key");
    expect(response.body.data.s3Key).to.be.a("string");
    expect(response.body.data.patientId.toString()).to.equal(patientRecord._id.toString());
    expect(response.body.data.uploaderId.toString()).to.equal(doctorUser._id.toString());
    expect(response.body.data.originalName).to.equal("test-document.pdf");
    expect(response.body.data.mimeType).to.equal("application/pdf");

    const document = await MedicalDocument.findById(response.body.data._id);
    expect(document).to.exist;
    expect(document.s3Key).to.be.a("string");
    expect(document.s3Key).to.include("documents/");
  });

  it("test_upload_invalid_mime_or_oversize: attempt upload with disallowed mime or >20MB => expect 4xx", async () => {
    const invalidMimeBuffer = Buffer.from("invalid content", "utf-8");

    const invalidMimeResponse = await request(app)
      .post(`${API_PREFIX}/patients/${patientRecord._id.toString()}/documents`)
      .set("Authorization", `Bearer ${authToken}`)
      .attach("file", invalidMimeBuffer, "test.txt")
      .field("category", "report")
      .expect(400);

    expect(invalidMimeResponse.body.success).to.be.false;
    expect(invalidMimeResponse.body.message).to.include("Invalid file type");

    const largeBuffer = createLargeBuffer(21 * 1024 * 1024);

    const oversizeResponse = await request(app)
      .post(`${API_PREFIX}/patients/${patientRecord._id.toString()}/documents`)
      .set("Authorization", `Bearer ${authToken}`)
      .attach("file", largeBuffer, "large-file.pdf")
      .field("category", "report")
      .expect(400);

    expect(oversizeResponse.body.success).to.be.false;
    expect(oversizeResponse.body.message).to.include("File size exceeds");
  });

  it("test_presigned_url: after upload, call presigned endpoint and assert returned URL is a string", async () => {
    const pdfBuffer = createPDFBuffer();

    const uploadResponse = await request(app)
      .post(`${API_PREFIX}/patients/${patientRecord._id.toString()}/documents`)
      .set("Authorization", `Bearer ${authToken}`)
      .attach("file", pdfBuffer, "test-document.pdf")
      .field("category", "report")
      .expect(201);

    const documentId = uploadResponse.body.data._id.toString();

    const presignedResponse = await request(app)
      .get(
        `${API_PREFIX}/patients/${patientRecord._id.toString()}/documents/${documentId}/presigned`
      )
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(presignedResponse.body.success).to.be.true;
    expect(presignedResponse.body.data).to.have.property("url");
    expect(presignedResponse.body.data.url).to.be.a("string");
    expect(presignedResponse.body.data.url.length).to.be.greaterThan(0);
  });
});

