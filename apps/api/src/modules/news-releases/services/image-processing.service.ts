import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageProcessingService {
  private s3: AWS.S3;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION'),
    });
    this.bucketName = this.configService.get('AWS_S3_NEWS_BUCKET') || 'vtex-day-news-images';
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string; thumbnailUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const maxSize = parseInt(this.configService.get('NEWS_IMAGE_MAX_SIZE') || '10485760', 10);
    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${maxSize} bytes`);
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
    }

    try {
      const fileName = `${uuidv4()}-${Date.now()}`;
      const originalKey = `news-releases/original/${fileName}`;
      const thumbnailKey = `news-releases/thumbnail/${fileName}`;

      const optimizedImage = await sharp(file.buffer)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      const thumbnail = await sharp(file.buffer)
        .resize(400, 300, {
          fit: 'cover',
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      await this.s3
        .putObject({
          Bucket: this.bucketName,
          Key: originalKey,
          Body: optimizedImage,
          ContentType: 'image/jpeg',
          CacheControl: 'max-age=31536000',
        })
        .promise();

      await this.s3
        .putObject({
          Bucket: this.bucketName,
          Key: thumbnailKey,
          Body: thumbnail,
          ContentType: 'image/jpeg',
          CacheControl: 'max-age=31536000',
        })
        .promise();

      const cloudFrontUrl = this.configService.get('CLOUDFRONT_URL');
      const baseUrl = cloudFrontUrl || `https://${this.bucketName}.s3.amazonaws.com`;

      return {
        url: `${baseUrl}/${originalKey}`,
        thumbnailUrl: `${baseUrl}/${thumbnailKey}`,
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to process image: ${error?.message || 'Unknown error'}`);
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Properly parse the URL to extract the key
      const url = new URL(imageUrl);
      let key = url.pathname.substring(1); // Remove leading slash

      // Validate the key doesn't contain path traversal attempts
      if (key.includes('../') || key.includes('..\\')) {
        throw new BadRequestException('Invalid image URL');
      }

      // Sanitize the key
      key = key.replace(/\.\./g, '').replace(/\/+/g, '/');

      if (key) {
        await this.s3
          .deleteObject({
            Bucket: this.bucketName,
            Key: key,
          })
          .promise();

        const thumbnailKey = key.replace('/original/', '/thumbnail/');
        await this.s3
          .deleteObject({
            Bucket: this.bucketName,
            Key: thumbnailKey,
          })
          .promise();
      }
    } catch (error: any) {
      if (error?.message === 'Invalid URL') {
        throw new BadRequestException('Invalid image URL format');
      }
      console.error('Failed to delete image from S3:', error);
    }
  }

  async generateResponsiveImages(file: Express.Multer.File): Promise<{
    original: string;
    large: string;
    medium: string;
    small: string;
    thumbnail: string;
  }> {
    const fileName = `${uuidv4()}-${Date.now()}`;
    const sizes = {
      original: { width: null, quality: 95 },
      large: { width: 1920, quality: 85 },
      medium: { width: 1024, quality: 80 },
      small: { width: 640, quality: 75 },
      thumbnail: { width: 320, quality: 70 },
    };

    const urls: any = {};

    for (const [size, config] of Object.entries(sizes)) {
      const key = `news-releases/${size}/${fileName}`;

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

      await this.s3
        .putObject({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: 'image/jpeg',
          CacheControl: 'max-age=31536000',
        })
        .promise();

      const cloudFrontUrl = this.configService.get('CLOUDFRONT_URL');
      const baseUrl = cloudFrontUrl || `https://${this.bucketName}.s3.amazonaws.com`;
      urls[size] = `${baseUrl}/${key}`;
    }

    return urls;
  }
}
