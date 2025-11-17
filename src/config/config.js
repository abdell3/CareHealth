require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 8000,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  MONGO_URI: process.env.MONGO_URI,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_REGION: process.env.S3_REGION,
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
  S3_SECRET_KEY: process.env.S3_SECRET_KEY,
};

