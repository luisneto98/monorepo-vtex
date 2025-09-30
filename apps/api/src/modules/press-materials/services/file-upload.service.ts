import { Injectable, BadRequestException } from '@nestjs/common';
import { S3_CONFIG } from '../../../config/s3.config';
import { SanitizationUtil } from '../../../common/utils/sanitization.util';
import { FileMetadata, FileUploadResponse, PressMaterialType } from '@vtexday26/shared';
import { StorageService } from '../../storage/services/storage.service';
import { FileCategory } from '../../storage/types/storage.types';

@Injectable()
export class FileUploadService {
  constructor(private storageService: StorageService) {}

  async uploadFile(
    file: Express.Multer.File,
    materialType: PressMaterialType,
    uploadedBy: string,
  ): Promise<FileUploadResponse> {
    this.validateFile(file, materialType);

    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

    try {
      // Use StorageService for upload (includes validation and virus scanning)
      const uploadResult = await this.storageService.uploadFile(
        file,
        FileCategory.PRESS_MATERIALS,
        {
          metadata: {
            uploadedBy,
            originalName: SanitizationUtil.sanitizeFilePath(file.originalname),
            materialType,
          },
        },
      );

      const metadata: FileMetadata = {
        size: file.size,
        format: fileExtension || '',
      };

      return {
        fileUrl: uploadResult.url,
        metadata,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new BadRequestException('Failed to upload file to S3');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fileKey = this.extractKeyFromUrl(fileUrl);
      await this.storageService.deleteFile(fileKey);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new BadRequestException('Failed to delete file from S3');
    }
  }

  async generateSignedUrl(fileUrl: string, expiresIn = S3_CONFIG.URL_EXPIRY): Promise<string> {
    try {
      const fileKey = this.extractKeyFromUrl(fileUrl);
      return await this.storageService.getSignedUrl(fileKey, expiresIn);
    } catch (error) {
      console.error('S3 signed URL error:', error);
      throw new BadRequestException('Failed to generate signed URL');
    }
  }

  private validateFile(file: Express.Multer.File, materialType: PressMaterialType): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Sanitize filename to prevent path traversal
    const sanitizedFilename = SanitizationUtil.sanitizeFilePath(file.originalname);
    const fileExtension = sanitizedFilename.split('.').pop()?.toLowerCase();
    const allowedFormats = S3_CONFIG.ALLOWED_FORMATS[materialType];

    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file format for ${materialType}. Allowed formats: ${allowedFormats.join(', ')}`,
      );
    }

    const maxSize =
      materialType === 'video' ? S3_CONFIG.MAX_FILE_SIZE.video : S3_CONFIG.MAX_FILE_SIZE.default;

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
      );
    }
  }

  private extractKeyFromUrl(fileUrl: string): string {
    // Sanitize file URL to prevent path traversal
    const sanitizedUrl = SanitizationUtil.sanitizeFilePath(fileUrl);

    const urlParts = sanitizedUrl.split('.amazonaws.com/');
    if (urlParts.length !== 2) {
      const pathParts = sanitizedUrl.split('/');
      const key = pathParts.slice(3).join('/');
      // Additional validation to ensure key doesn't contain path traversal
      return SanitizationUtil.sanitizeFilePath(key);
    }
    return SanitizationUtil.sanitizeFilePath(urlParts[1]);
  }
}
