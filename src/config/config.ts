import "dotenv/config";

export const PORT = process.env.PORT || 8000;
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const MONGO_URI = process.env.MONGO_URI;
export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = process.env.REDIS_PORT;
export const S3_BUCKET = process.env.S3_BUCKET;
export const S3_REGION = process.env.S3_REGION;
export const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
export const S3_SECRET_KEY = process.env.S3_SECRET_KEY;


