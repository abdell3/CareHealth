process.env.NODE_ENV = 'test';
process.env.API_VERSION = 'v1';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';
process.env.S3_BUCKET_NAME = 'test-bucket';

const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const RoleModel = require('../src/modules/users/Role');
const RefreshTokenModel = require('../src/modules/auth/RefreshToken');
const { app } = require('../server');

const API_PREFIX = '/api/v1';

const seedRoles = async () => {
  const Role = RoleModel.getModel();
  await Role.deleteMany({});
  await Role.initializeDefaultRoles();
};

describe('Auth flows', function () {
  this.timeout(20000);
  let mongoServer;

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
  });

  it('registers, logs in, refreshes tokens, and enforces rotation', async () => {
    const registerPayload = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'Password123!',
      phone: '+1111111111',
      gender: 'other',
      dateOfBirth: '1990-01-01',
    };

    const registerRes = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send(registerPayload)
      .expect(201);

    expect(registerRes.body.data.tokens.refreshToken).to.exist;

    const loginRes = await request(app)
      .post(`${API_PREFIX}/auth/login`)
      .send({ email: registerPayload.email, password: registerPayload.password })
      .expect(200);

    const { accessToken, refreshToken } = loginRes.body.data.tokens;
    expect(accessToken).to.be.a('string');
    expect(refreshToken).to.be.a('string');

    const refreshRes = await request(app)
      .post(`${API_PREFIX}/auth/refresh-token`)
      .send({ refreshToken })
      .expect(200);

    const rotatedRefresh = refreshRes.body.data.refreshToken;
    expect(rotatedRefresh).to.be.a('string');
    expect(rotatedRefresh).to.not.equal(refreshToken);

    const RefreshToken = RefreshTokenModel.getModel();
    const oldTokenEntry = await RefreshToken.findOne({ token: refreshToken });
    expect(oldTokenEntry).to.be.null;
    const newTokenEntry = await RefreshToken.findOne({ token: rotatedRefresh });
    expect(newTokenEntry).to.exist;

    await request(app)
      .post(`${API_PREFIX}/auth/refresh-token`)
      .send({ refreshToken })
      .expect(401);

    await request(app)
      .post(`${API_PREFIX}/auth/logout`)
      .send({ refreshToken: rotatedRefresh })
      .expect(200);

    const afterLogoutEntry = await RefreshToken.findOne({ token: rotatedRefresh });
    expect(afterLogoutEntry).to.be.null;

    await request(app)
      .post(`${API_PREFIX}/auth/refresh-token`)
      .send({ refreshToken: rotatedRefresh })
      .expect(401);
  });
});

