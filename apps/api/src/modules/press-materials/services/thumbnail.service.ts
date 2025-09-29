import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createS3Client, getS3BucketName } from '../../../config/s3.config';
import { PressMaterialType } from '@vtexday26/shared';

@Injectable()
export class ThumbnailService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(configService: ConfigService) {
    this.s3Client = createS3Client(configService);
    this.bucketName = getS3BucketName(configService);
  }

  async generateThumbnail(
    file: Express.Multer.File,
    materialType: PressMaterialType,
    originalFileUrl: string,
  ): Promise<string | undefined> {
    if (materialType !== 'photo' && materialType !== 'video') {
      return undefined;
    }

    if (materialType === 'photo') {
      return this.generateImageThumbnail(file, originalFileUrl);
    }

    // For video thumbnails, we would need ffmpeg which requires more setup
    // For now, we'll skip video thumbnails
    return undefined;
  }

  private async generateImageThumbnail(
    file: Express.Multer.File,
    originalFileUrl: string,
  ): Promise<string> {
    try {
      const thumbnailBuffer = await sharp
        .default(file.buffer)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailKey = this.generateThumbnailKey(originalFileUrl);

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
        }),
      );

      return `https://${this.bucketName}.s3.amazonaws.com/${thumbnailKey}`;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      // Return undefined if thumbnail generation fails
      // We don't want to fail the entire upload because of thumbnail
      return undefined;
    }
  }

  private generateThumbnailKey(originalFileUrl: string): string {
    const urlParts = originalFileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const nameWithoutExtension = fileName.split('.')[0];
    const path = urlParts.slice(3, -1).join('/');
    return `${path}/thumbnails/${nameWithoutExtension}_thumb.jpg`;
  }
}
