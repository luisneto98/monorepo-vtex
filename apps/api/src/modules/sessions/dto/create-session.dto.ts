import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateSessionDto {
  @ApiProperty({
    description: 'Session title in multiple languages',
    example: {
      'pt-BR': 'Keynote de Abertura - O Futuro do Comércio Digital',
      en: 'Opening Keynote - The Future of Digital Commerce',
    },
    type: MultilingualTextDto,
  })
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  title: MultilingualTextDto;

  @ApiProperty({
    description: 'Session description in multiple languages',
    example: {
      'pt-BR': 'Uma visão abrangente sobre as tendências do e-commerce',
      en: 'A comprehensive view of e-commerce trends',
    },
    type: MultilingualTextDto,
  })
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  description: MultilingualTextDto;

  @ApiProperty({
    description: 'Type of session',
    enum: SessionType,
    example: SessionType.KEYNOTE,
  })
  @IsEnum(SessionType)
  type: SessionType;

  @ApiProperty({
    description: 'Session start time (ISO 8601 format)',
    example: '2025-11-26T09:00:00.000Z',
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({
    description: 'Session end time (ISO 8601 format)',
    example: '2025-11-26T10:00:00.000Z',
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @ApiProperty({
    description: 'Stage or room where session takes place',
    enum: SessionStage,
    example: SessionStage.PRINCIPAL,
  })
  @IsEnum(SessionStage)
  stage: SessionStage;

  @ApiPropertyOptional({
    description: 'Array of speaker MongoDB IDs',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  speakerIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of sponsor MongoDB IDs',
    type: [String],
    example: ['507f1f77bcf86cd799439013'],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  sponsorIds?: string[];

  @ApiPropertyOptional({
    description: 'Session tags for categorization',
    type: [String],
    example: ['AI', 'B2B', 'Innovation', 'Technology'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Maximum capacity for this session',
    type: Number,
    minimum: 1,
    example: 150,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Mark session as highlighted/featured',
    type: Boolean,
    default: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isHighlight?: boolean;

  @ApiPropertyOptional({
    description: 'Session visibility status',
    type: Boolean,
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
