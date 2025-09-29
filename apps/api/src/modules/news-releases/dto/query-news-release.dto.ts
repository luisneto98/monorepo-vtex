import {
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsDate,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NewsReleaseStatus } from '@vtexday26/shared';

export class QueryNewsReleaseDto {
  @ApiPropertyOptional({ enum: NewsReleaseStatus })
  @IsOptional()
  @IsEnum(NewsReleaseStatus)
  status?: NewsReleaseStatus;

  @ApiPropertyOptional({ description: 'Filter by multiple statuses' })
  @IsOptional()
  @IsArray()
  @IsEnum(NewsReleaseStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  statuses?: NewsReleaseStatus[];

  @ApiPropertyOptional({ description: 'Filter by featured flag' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Filter by categories', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  categories?: string[];

  @ApiPropertyOptional({ description: 'Filter by tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  tags?: string[];

  @ApiPropertyOptional({ description: 'Filter by author ID' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: 'Search in title and content' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by language', enum: ['pt-BR', 'en', 'es'] })
  @IsOptional()
  @IsIn(['pt-BR', 'en', 'es'])
  language?: 'pt-BR' | 'en' | 'es';

  @ApiPropertyOptional({ description: 'Published after date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  publishedAfter?: Date;

  @ApiPropertyOptional({ description: 'Published before date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  publishedBefore?: Date;

  @ApiPropertyOptional({ description: 'Include deleted items', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeleted?: boolean;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['createdAt', 'publishedAt', 'viewCount', 'title'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'publishedAt', 'viewCount', 'title'])
  sortBy?: 'createdAt' | 'publishedAt' | 'viewCount' | 'title' = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
