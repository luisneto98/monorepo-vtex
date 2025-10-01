import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { StorageConfigService } from './storage-config.service';
import { VirusScannerService } from './virus-scanner.service';
import {
  FileCategory,
  UploadResult,
  UploadOptions,
  FileValidationOptions,
  MagicBytesPattern,
} from '../types/storage.types';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly logger = new Logger(StorageService.name);

  // Magic bytes patterns for file type validation
  private readonly magicBytesPatterns: MagicBytesPattern[] = [
    { mimeType: 'image/jpeg', pattern: Buffer.from([0xff, 0xd8, 0xff]) },
    {
      mimeType: 'image/png',
      pattern: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    },
    { mimeType: 'image/webp', pattern: Buffer.from([0x52, 0x49, 0x46, 0x46]), offset: 0 }, // RIFF
    { mimeType: 'image/gif', pattern: Buffer.from([0x47, 0x49, 0x46, 0x38]) }, // GIF8
    { mimeType: 'application/pdf', pattern: Buffer.from([0x25, 0x50, 0x44, 0x46]) }, // %PDF
  ];

  // Default options per category
  private readonly categoryDefaults: Record<
    FileCategory,
    { maxSizeBytes: number; allowedMimeTypes: string[] }
  > = {
    [FileCategory.SPEAKER_PHOTOS]: {
      maxSizeBytes: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
    [FileCategory.SPONSOR_LOGOS]: {
      maxSizeBytes: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
    [FileCategory.LEGAL_DOCUMENTS]: {
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['application/pdf'],
    },
    [FileCategory.PRESS_MATERIALS]: {
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    [FileCategory.NEWS_IMAGES]: {
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    },
  };

  constructor(
    private storageConfigService: StorageConfigService,
    private virusScannerService: VirusScannerService,
  ) {
    this.region = this.storageConfigService.getAwsRegion();
    this.bucketName = this.storageConfigService.getAwsBucket();

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.storageConfigService.getAwsAccessKeyId(),
        secretAccessKey: this.storageConfigService.getAwsSecretAccessKey(),
      },
    });
  }

  /**
   * Uploads a file to S3 with validation and virus scanning
   * @param file - The file to upload
   * @param category - The category of the file
   * @param options - Optional upload options
   * @returns Promise<UploadResult> - The S3 key and public URL
   */
  async uploadFile(
    file: Express.Multer.File,
    category: FileCategory,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    try {
      // Get default options for category
      const defaults = this.categoryDefaults[category];

      // Merge options with defaults
      const uploadOptions: UploadOptions = {
        maxSizeBytes: options?.maxSizeBytes ?? defaults.maxSizeBytes,
        allowedMimeTypes: options?.allowedMimeTypes ?? defaults.allowedMimeTypes,
        scanForVirus: options?.scanForVirus ?? true,
        metadata: options?.metadata,
      };

      // Validate file
      await this.validateFile(file, {
        maxSizeBytes: uploadOptions.maxSizeBytes!,
        allowedMimeTypes: uploadOptions.allowedMimeTypes!,
        validateMagicBytes: true,
      });

      // Scan for viruses
      if (uploadOptions.scanForVirus) {
        await this.virusScannerService.scanFile(file.buffer, file.originalname, file.mimetype);
      }

      // Generate unique S3 key
      const key = this.generateFileKey(file.originalname, category);

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: uploadOptions.metadata,
      });

      await this.s3Client.send(command);

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(`File uploaded successfully to S3: ${key}`);
      return { key, url };
    } catch (error: any) {
      // If it's a validation or scanning error, rethrow it
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`Failed to upload file to S3: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to upload file to storage');
    }
  }

  /**
   * Validates a file against specified options
   * @param file - The file to validate
   * @param options - Validation options
   * @returns Promise<boolean> - true if valid, throws error otherwise
   */
  async validateFile(file: Express.Multer.File, options: FileValidationOptions): Promise<boolean> {
    // Check file exists
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('No file provided or file is empty');
    }

    // Check file size
    if (file.size > options.maxSizeBytes) {
      const maxSizeMB = (options.maxSizeBytes / (1024 * 1024)).toFixed(0);
      throw new BadRequestException(`File size exceeds maximum allowed size of ${maxSizeMB}MB.`);
    }

    // Check MIME type
    if (!options.allowedMimeTypes.includes(file.mimetype)) {
      const allowedTypes = options.allowedMimeTypes
        .map((type) => type.split('/')[1].toUpperCase())
        .join(', ');
      throw new BadRequestException(`Invalid file type. Only ${allowedTypes} files are allowed.`);
    }

    // Validate magic bytes if requested
    if (options.validateMagicBytes) {
      const isValidMagicBytes = this.validateMagicBytes(file.buffer, file.mimetype);
      if (!isValidMagicBytes) {
        throw new BadRequestException('File content does not match declared file type.');
      }
    }

    return true;
  }

  /**
   * Validates file magic bytes match the declared MIME type
   * @param buffer - The file buffer
   * @param mimeType - The declared MIME type
   * @returns boolean - true if magic bytes match
   */
  private validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
    const pattern = this.magicBytesPatterns.find((p) => p.mimeType === mimeType);

    if (!pattern) {
      // No pattern defined for this MIME type, skip validation
      this.logger.debug(`No magic bytes pattern defined for ${mimeType}`);
      return true;
    }

    const offset = pattern.offset ?? 0;
    const fileBytes = buffer.slice(offset, offset + pattern.pattern.length);

    // Special handling for WebP (RIFF...WEBP format)
    if (mimeType === 'image/webp') {
      const riffMatch = fileBytes.slice(0, 4).equals(pattern.pattern);
      const webpMarker = buffer.slice(8, 12).toString('ascii');
      return riffMatch && webpMarker === 'WEBP';
    }

    return fileBytes.equals(pattern.pattern);
  }

  /**
   * Deletes a file from S3
   * @param key - The S3 key of the file to delete
   */
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

  /**
   * Gets a signed URL for secure file downloads
   * @param key - The S3 key of the file
   * @param expiresIn - URL expiration time in seconds (default: 3600)
   * @returns Promise<string> - The signed URL
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
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

  /**
   * Gets a file from S3
   * @param key - The S3 key of the file
   * @returns Promise<Readable> - The file stream
   */
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

  /**
   * Gets file metadata from S3
   * @param key - The S3 key of the file
   * @returns Promise<{size: number, contentType: string}>
   */
  async getFileMetadata(key: string): Promise<{ size: number; contentType: string }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
      };
    } catch (error: any) {
      this.logger.error(`Failed to get file metadata from S3: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve file metadata');
    }
  }

  /**
   * Generates a unique S3 key for a file
   * @param filename - The original filename
   * @param category - The file category
   * @returns string - The generated S3 key
   */
  private generateFileKey(filename: string, category: FileCategory): string {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const extension = filename.split('.').pop() || 'bin';
    const sanitizedExtension = extension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    return `${category}/${timestamp}-${random}.${sanitizedExtension}`;
  }
}
