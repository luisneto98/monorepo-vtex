import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsEnum, IsString, IsArray } from 'class-validator';
import { PressMaterialType, PublicationStatus, AccessLevel } from '@vtexday26/shared';

export class QueryPressMaterialDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: ['createdAt', 'downloadCount', 'title'],
    default: 'createdAt',
  })
  @IsEnum(['createdAt', 'downloadCount', 'title'])
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    enum: ['press_kit', 'logo_package', 'photo', 'video', 'presentation'],
  })
  @IsEnum(['press_kit', 'logo_package', 'photo', 'video', 'presentation'])
  @IsOptional()
  type?: PressMaterialType;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'] })
  @IsEnum(['draft', 'published', 'archived'])
  @IsOptional()
  status?: PublicationStatus;

  @ApiPropertyOptional({ enum: ['public', 'restricted'] })
  @IsEnum(['public', 'restricted'])
  @IsOptional()
  accessLevel?: AccessLevel;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}
