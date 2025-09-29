import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';
import { S3_CONFIG } from './s3.config';

export const multerConfig: MulterOptions = {
  limits: {
    fileSize: S3_CONFIG.MAX_FILE_SIZE.default,
  },
  fileFilter: (_req, file, callback) => {
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    if (!extension) {
      return callback(new BadRequestException('File must have an extension'), false);
    }

    // Check if extension is allowed for any material type
    const isAllowed = Object.values(S3_CONFIG.ALLOWED_FORMATS).some((formats) =>
      formats.includes(extension),
    );

    if (!isAllowed) {
      return callback(new BadRequestException(`File type .${extension} is not allowed`), false);
    }

    callback(null, true);
  },
};

export const getMulterOptionsForType = (materialType: string): MulterOptions => {
  const allowedFormats = S3_CONFIG.ALLOWED_FORMATS[materialType];
  const maxSize =
    materialType === 'video' ? S3_CONFIG.MAX_FILE_SIZE.video : S3_CONFIG.MAX_FILE_SIZE.default;

  return {
    limits: {
      fileSize: maxSize,
    },
    fileFilter: (_req, file, callback) => {
      const extension = file.originalname.split('.').pop()?.toLowerCase();

      if (!extension) {
        return callback(new BadRequestException('File must have an extension'), false);
      }

      if (!allowedFormats || !allowedFormats.includes(extension)) {
        return callback(
          new BadRequestException(`File type .${extension} is not allowed for ${materialType}`),
          false,
        );
      }

      callback(null, true);
    },
  };
};
