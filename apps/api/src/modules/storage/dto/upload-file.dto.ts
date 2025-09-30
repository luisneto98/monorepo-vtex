import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { FileCategory } from '../types/storage.types';

export class UploadFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload',
  })
  file: Express.Multer.File;

  @ApiProperty({
    enum: FileCategory,
    description: 'Category of the file being uploaded',
    example: FileCategory.SPEAKER_PHOTOS,
  })
  @IsEnum(FileCategory)
  @IsOptional()
  category?: FileCategory;
}
