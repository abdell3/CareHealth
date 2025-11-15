const AWS = require("aws-sdk");

class S3Service {
  constructor() {
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      s3ForcePathStyle: true,
      signatureVersion: "v4",
      region: process.env.S3_REGION || "us-east-1",
    });
    this.bucketName = process.env.S3_BUCKET_NAME;
  }

  async uploadFile({ patientId, fileName, buffer, mimeType }) {
    this.assertBucketConfigured();

    const key = `${patientId}/${Date.now()}-${fileName}`;
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ServerSideEncryption: "AES256",
      Metadata: {
        patientId: String(patientId),
      },
    };

    try {
      await this.s3.upload(params).promise();
      return { key };
    } catch (error) {
      throw this.buildError("Failed to upload file to S3");
    }
  }

  async getPresignedUrl(key, expiresSeconds = 600) {
    this.assertBucketConfigured();
    try {
      return await this.s3.getSignedUrlPromise("getObject", {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresSeconds,
      });
    } catch (error) {
      throw this.buildError("Failed to generate presigned URL");
    }
  }

  async deleteFile(key) {
    this.assertBucketConfigured();
    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucketName,
          Key: key,
        })
        .promise();
      return true;
    } catch (error) {
      throw this.buildError("Failed to delete file from S3");
    }
  }

  assertBucketConfigured() {
    if (!this.bucketName) {
      throw this.buildError("S3 bucket is not configured", 500);
    }
  }

  buildError(message, statusCode = 500) {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
  }
}

module.exports = new S3Service();
