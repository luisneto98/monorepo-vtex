import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsDate,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { MultilingualTextDto } from '@common/dto/multilingual.dto';
import { SessionType, SessionStage } from '@shared/types/session.types';

export class UpdateSessionDto {
  @ApiPropertyOptional({
    description: 'Session title in multiple languages',
    example: {
      'pt-BR': 'Keynote de Abertura - O Futuro do Comércio Digital',
      'en': 'Opening Keynote - The Future of Digital Commerce'
    },
    type: MultilingualTextDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  title?: MultilingualTextDto;

  @ApiPropertyOptional({
    description: 'Session description in multiple languages',
    example: {
      'pt-BR': 'Uma visão abrangente sobre as tendências do e-commerce',
      'en': 'A comprehensive view of e-commerce trends'
    },
    type: MultilingualTextDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  description?: MultilingualTextDto;

  @ApiPropertyOptional({
    description: 'Type of session',
    enum: SessionType,
    example: SessionType.KEYNOTE
  })
  @IsOptional()
  @IsEnum(SessionType)
  type?: SessionType;

  @ApiPropertyOptional({
    description: 'Session start time (ISO 8601 format)',
    example: '2025-11-26T09:00:00.000Z',
    type: Date
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startTime?: Date;

  @ApiPropertyOptional({
    description: 'Session end time (ISO 8601 format)',
    example: '2025-11-26T10:00:00.000Z',
    type: Date
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endTime?: Date;

  @ApiPropertyOptional({
    description: 'Stage or room where session takes place',
    enum: SessionStage,
    example: SessionStage.PRINCIPAL
  })
  @IsOptional()
  @IsEnum(SessionStage)
  stage?: SessionStage;

  @ApiPropertyOptional({
    description: 'Array of speaker MongoDB IDs',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  speakerIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of sponsor MongoDB IDs',
    type: [String],
    example: ['507f1f77bcf86cd799439013']
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  sponsorIds?: string[];

  @ApiPropertyOptional({
    description: 'Session tags for categorization',
    type: [String],
    example: ['AI', 'B2B', 'Innovation', 'Technology']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Maximum capacity for this session',
    type: Number,
    minimum: 1,
    example: 150
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Current number of registered attendees',
    type: Number,
    minimum: 0,
    example: 75
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  registeredCount?: number;

  @ApiPropertyOptional({
    description: 'Mark session as highlighted/featured',
    type: Boolean,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isHighlight?: boolean;

  @ApiPropertyOptional({
    description: 'Session visibility status',
    type: Boolean,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}