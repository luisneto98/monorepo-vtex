import { IsString, IsObject, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

export class ImageUploadDto {
  @ApiPropertyOptional({ description: 'Image captions by language' })
  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        // Validate it's a plain object with string values
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new BadRequestException('Caption must be an object');
        }
        // Ensure all values are strings and keys are valid language codes
        const validLangs = ['pt-BR', 'en', 'es'];
        for (const [key, val] of Object.entries(parsed)) {
          if (!validLangs.includes(key)) {
            throw new BadRequestException(`Invalid language code: ${key}`);
          }
          if (typeof val !== 'string') {
            throw new BadRequestException('Caption values must be strings');
          }
        }
        return parsed;
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Invalid JSON format for caption');
      }
    }
    return value;
  })
  caption?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Alt text by language' })
  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        // Validate it's a plain object with string values
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new BadRequestException('Alt text must be an object');
        }
        // Ensure all values are strings and keys are valid language codes
        const validLangs = ['pt-BR', 'en', 'es'];
        for (const [key, val] of Object.entries(parsed)) {
          if (!validLangs.includes(key)) {
            throw new BadRequestException(`Invalid language code: ${key}`);
          }
          if (typeof val !== 'string') {
            throw new BadRequestException('Alt text values must be strings');
          }
        }
        return parsed;
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Invalid JSON format for alt text');
      }
    }
    return value;
  })
  altText?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Display order', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  order?: number;
}

export class ReorderImagesDto {
  @ApiProperty({ description: 'Ordered array of image IDs' })
  @IsString({ each: true })
  imageIds: string[];
}
