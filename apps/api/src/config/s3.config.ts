import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export const createS3Client = (configService: ConfigService) => {
  const region = configService.get('aws.s3.region');
  const accessKeyId = configService.get('aws.s3.accessKeyId');
  const secretAccessKey = configService.get('aws.s3.secretAccessKey');

  if (!accessKeyId || !secretAccessKey) {
    console.warn('AWS credentials not configured, using default chain');
  }

  return new S3Client({
    region,
    ...(accessKeyId &&
      secretAccessKey && {
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      }),
  });
};

export const getS3BucketName = (configService: ConfigService): string => {
  const bucket = configService.get<string>('aws.s3.bucket');
  if (!bucket) {
    console.warn('S3 bucket name not configured, using default: vtexday-dev-bucket');
    return 'vtexday-dev-bucket';
  }
  return bucket;
};

export const S3_CONFIG = {
  MAX_FILE_SIZE: {
    video: 500 * 1024 * 1024, // 500MB
    default: 50 * 1024 * 1024, // 50MB
  },
  ALLOWED_FORMATS: {
    press_kit: ['pdf', 'zip'],
    logo_package: ['zip', 'ai', 'eps', 'svg'],
    photo: ['jpg', 'jpeg', 'png', 'webp'],
    video: ['mp4', 'mov', 'webm'],
    presentation: ['ppt', 'pptx', 'pdf'],
  },
  URL_EXPIRY: 24 * 60 * 60, // 24 hours in seconds
};
