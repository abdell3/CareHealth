const AWS = require("aws-sdk");

class S3Service {
  constructor() {
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      s3ForcePathStyle: true,
      signatureVersion: "v4",
    });
    this.bucketName = process.env.S3_BUCKET_NAME || "medical-documents";
  }

  async uploadFile(data) {
    const key = `${data.patientId}/${Date.now()}-${data.fileName}`;

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: data.fileBuffer,
      ContentType: data.mimeType,
      ServerSideEncryption: "AES256",
      Metadata: {
        "patient-id": data.patientId,
        "uploaded-by": data.uploadedBy,
        "document-type": data.documentType,
      },
    };

    try {
      await this.s3.upload(params).promise();
      const url = `${process.env.S3_ENDPOINT}/${this.bucketName}/${key}`;
      return { key, url };
    } catch (error) {
      const err = new Error("Failed to upload file to S3");
      err.statusCode = 500;
      throw err;
    }
  }

  async getPresignedUrl(key, expiresIn = 600) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: expiresIn,
    };

    try {
      return this.s3.getSignedUrl("getObject", params);
    } catch (error) {
      const err = new Error("Failed to generate presigned URL");
      err.statusCode = 500;
      throw err;
    }
  }

  async deleteFile(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
    };

    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      const err = new Error("Failed to delete file from S3");
      err.statusCode = 500;
      throw err;
    }
  }
}

module.exports = new S3Service();
