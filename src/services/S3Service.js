const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const config = require("../config/config");
const { AppError } = require("../core/errors/AppError");

class S3Service {
  constructor() {
    this.client = null;
    this.bucketName = null;
  }

  init() {
    if (!config.S3_BUCKET_NAME) {
      throw new AppError("S3_BUCKET_NAME is not configured", 500);
    }

    this.bucketName = config.S3_BUCKET_NAME;

    const clientConfig = {
      region: config.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY || "",
        secretAccessKey: config.S3_SECRET_KEY || "",
      },
    };

    if (config.S3_ENDPOINT) {
      clientConfig.endpoint = config.S3_ENDPOINT;
      clientConfig.forcePathStyle = true;
    }

    this.client = new S3Client(clientConfig);
  }

  assertBucketConfigured() {
    if (!this.bucketName) {
      throw new AppError("S3 bucket is not configured. Call init() first.", 500);
    }
  }

  async uploadFile({ key, buffer, mimeType, acl }) {
    this.assertBucketConfigured();

    if (!this.client) {
      this.init();
    }

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    };

    if (acl) {
      params.ACL = acl;
    }

    try {
      const command = new PutObjectCommand(params);
      const result = await this.client.send(command);

      return {
        key,
        size: buffer.length,
      };
    } catch (error) {
      throw new AppError(`Failed to upload file to S3: ${error.message}`, 500);
    }
  }

  async getPresignedUrl(key, expiresSeconds = 600) {
    this.assertBucketConfigured();

    if (!this.client) {
      this.init();
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn: expiresSeconds,
      });

      return url;
    } catch (error) {
      throw new AppError(`Failed to generate presigned URL: ${error.message}`, 500);
    }
  }

  async deleteFile(key) {
    this.assertBucketConfigured();

    if (!this.client) {
      this.init();
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);

      return { success: true };
    } catch (error) {
      throw new AppError(`Failed to delete file from S3: ${error.message}`, 500);
    }
  }
}

module.exports = new S3Service();

