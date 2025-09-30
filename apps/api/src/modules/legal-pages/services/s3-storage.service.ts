import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class S3StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly logger = new Logger(S3StorageService.name);

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET', 'vtexday26-legal-docs');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  async uploadFile(
    key: string,
    file: Express.Multer.File,
    metadata?: Record<string, string>,
  ): Promise<{ key: string; url: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: metadata,
      });

      await this.s3Client.send(command);

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(`File uploaded successfully to S3: ${key}`);
      return { key, url };
    } catch (error: any) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to upload file to storage');
    }
  }

  async getFile(key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return response.Body as Readable;
    } catch (error: any) {
      this.logger.error(`Failed to get file from S3: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve file from storage');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully from S3: ${key}`);
    } catch (error: any) {
      this.logger.error(`Failed to delete file from S3: ${error.message}`, error.stack);
      // Don't throw error on delete failure, just log it
    }
  }

  async getFileMetadata(key: string): Promise<{ size: number; contentType: string }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/pdf',
      };
    } catch (error: any) {
      this.logger.error(`Failed to get file metadata from S3: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve file metadata');
    }
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error: any) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  generateFileKey(filename: string, prefix = 'legal-pages'): string {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = filename.split('.').pop();
    return `${prefix}/${uniqueSuffix}.${extension}`;
  }
}
