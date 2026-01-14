// ABOUTME: S3Service provides AWS S3 file storage operations with presigned URLs
// ABOUTME: Supports upload, download, copy, delete operations for multi-tenant file management

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EnvironmentVariables } from '../../config/EnvironmentVariables';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION_NAME', { infer: true }),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID', {
          infer: true,
        }),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY', {
          infer: true,
        }),
      },
    });
    this.bucketName = this.configService.get('AWS_BUCKET_NAME', {
      infer: true,
    });
  }

  /**
   * Generate presigned URL for uploading file to S3
   * @param key S3 object key (path)
   * @param expiresIn URL expiration time in seconds (default: 300 = 5 minutes)
   * @returns Presigned upload URL
   */
  async getSignedUploadUrl(
    key: string,
    expiresIn: number = 300,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generate presigned URL for downloading file from S3
   * @param key S3 object key (path)
   * @param expiresIn URL expiration time in seconds (default: 300 = 5 minutes)
   * @returns Presigned download URL
   */
  async getSignedDownloadUrl(
    key: string,
    expiresIn: number = 300,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Upload file buffer directly to S3 (server-side upload)
   * @param key S3 object key (path)
   * @param buffer File buffer
   * @param contentType MIME type
   * @returns Upload result with ETag, bucket, and key
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<{ etag: string | undefined; bucket: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    const response = await this.s3Client.send(command);

    return {
      etag: response.ETag,
      bucket: this.bucketName,
      key,
    };
  }

  /**
   * Copy object within S3
   * @param destinationKey Destination S3 key
   * @param copySource Source S3 path (format: "bucket/key")
   * @returns Copy result with ETag, bucket, and key
   */
  async copyFile(
    destinationKey: string,
    copySource: string,
  ): Promise<{ etag: string | undefined; bucket: string; key: string }> {
    const command = new CopyObjectCommand({
      Bucket: this.bucketName,
      Key: destinationKey,
      CopySource: copySource,
    });

    const response = await this.s3Client.send(command);

    return {
      etag: response.CopyObjectResult?.ETag,
      bucket: this.bucketName,
      key: destinationKey,
    };
  }

  /**
   * Delete file from S3
   * @param key S3 object key (path)
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Get S3 client instance (for advanced operations)
   */
  getClient(): S3Client {
    return this.s3Client;
  }

  /**
   * Get configured bucket name
   */
  getBucketName(): string {
    return this.bucketName;
  }
}
