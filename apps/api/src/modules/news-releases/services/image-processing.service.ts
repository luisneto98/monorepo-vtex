import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { StorageService } from '../../storage/services/storage.service';
import { FileCategory } from '../../storage/types/storage.types';

@Injectable()
export class ImageProcessingService {
  constructor(private storageService: StorageService) {}

  async uploadImage(file: Express.Multer.File): Promise<{ url: string; thumbnailUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      // Process optimized image
      const optimizedImage = await sharp(file.buffer)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      // Process thumbnail
      const thumbnail = await sharp(file.buffer)
        .resize(400, 300, {
          fit: 'cover',
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Upload optimized image using StorageService
      const originalFile: Express.Multer.File = {
        ...file,
        buffer: optimizedImage,
        mimetype: 'image/jpeg',
        size: optimizedImage.length,
        originalname: file.originalname.replace(/\.[^.]+$/, '.jpg'),
      };

      const thumbnailFile: Express.Multer.File = {
        ...file,
        buffer: thumbnail,
        mimetype: 'image/jpeg',
        size: thumbnail.length,
        originalname: `thumb-${file.originalname.replace(/\.[^.]+$/, '.jpg')}`,
      };

      // Upload both files using StorageService
      const originalResult = await this.storageService.uploadFile(
        originalFile,
        FileCategory.NEWS_IMAGES,
        {
          scanForVirus: true,
        },
      );

      const thumbnailResult = await this.storageService.uploadFile(
        thumbnailFile,
        FileCategory.NEWS_IMAGES,
        {
          scanForVirus: false, // Skip virus scan for thumbnail since original was scanned
        },
      );

      return {
        url: originalResult.url,
        thumbnailUrl: thumbnailResult.url,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to process image: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract the S3 key from the URL
      const url = new URL(imageUrl);
      let key = url.pathname.substring(1); // Remove leading slash

      // Validate the key doesn't contain path traversal attempts
      if (key.includes('../') || key.includes('..\\')) {
        throw new BadRequestException('Invalid image URL');
      }

      // Sanitize the key
      key = key.replace(/\.\./g, '').replace(/\/+/g, '/');

      if (key) {
        // Delete the main image
        await this.storageService.deleteFile(key);

        // Try to delete thumbnail (may not exist for all images)
        const thumbnailKey = key.replace(/\/([^/]+)$/, '/thumb-$1');
        try {
          await this.storageService.deleteFile(thumbnailKey);
        } catch (error) {
          // Ignore thumbnail deletion errors
        }
      }
    } catch (error: any) {
      if (error?.message === 'Invalid URL') {
        throw new BadRequestException('Invalid image URL format');
      }
      console.error('Failed to delete image:', error);
    }
  }

  async generateResponsiveImages(file: Express.Multer.File): Promise<{
    original: string;
    large: string;
    medium: string;
    small: string;
    thumbnail: string;
  }> {
    const sizes = {
      original: { width: null, quality: 95 },
      large: { width: 1920, quality: 85 },
      medium: { width: 1024, quality: 80 },
      small: { width: 640, quality: 75 },
      thumbnail: { width: 320, quality: 70 },
    };

    const urls: any = {};

    for (const [size, config] of Object.entries(sizes)) {
      let processedImage = sharp(file.buffer);

      if (config.width) {
        processedImage = processedImage.resize(config.width, null, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      const buffer = await processedImage
        .jpeg({ quality: config.quality, progressive: true })
        .toBuffer();

      // Create a new file object with processed buffer
      const processedFile: Express.Multer.File = {
        ...file,
        buffer,
        mimetype: 'image/jpeg',
        size: buffer.length,
        originalname: `${size}-${file.originalname.replace(/\.[^.]+$/, '.jpg')}`,
      };

      // Upload using StorageService
      const result = await this.storageService.uploadFile(
        processedFile,
        FileCategory.NEWS_IMAGES,
        {
          scanForVirus: size === 'original', // Only scan original
        },
      );

      urls[size] = result.url;
    }

    return urls;
  }
}
