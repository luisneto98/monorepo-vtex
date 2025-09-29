import { PartialType } from '@nestjs/swagger';
import { CreateNewsReleaseDto } from './create-news-release.dto';
import {
  IsArray,
  IsOptional,
  ValidateNested,
  IsString,
  IsNumber,
  IsUrl,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImageGalleryItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiProperty({ description: 'Image URL' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Image captions by language' })
  @IsOptional()
  @IsObject()
  caption?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Alt text by language' })
  @IsOptional()
  @IsObject()
  altText?: Record<string, string>;

  @ApiProperty({ description: 'Display order', minimum: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  order: number;
}

export class UpdateNewsReleaseDto extends PartialType(CreateNewsReleaseDto) {
  @ApiPropertyOptional({ type: [ImageGalleryItemDto], description: 'Image gallery items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageGalleryItemDto)
  images?: ImageGalleryItemDto[];
}
