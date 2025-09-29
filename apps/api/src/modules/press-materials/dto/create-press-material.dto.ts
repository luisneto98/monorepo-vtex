import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PressMaterialType,
  PublicationStatus,
  AccessLevel,
  LocalizedString,
} from '@vtexday26/shared';

class LocalizedStringDto implements LocalizedString {
  @ApiProperty({ description: 'Portuguese (Brazil) text' })
  @IsString()
  @IsNotEmpty()
  pt: string;

  @ApiProperty({ description: 'English text' })
  @IsString()
  @IsNotEmpty()
  en: string;

  @ApiProperty({ description: 'Spanish text' })
  @IsString()
  @IsNotEmpty()
  es: string;
}

export class CreatePressMaterialDto {
  @ApiProperty({
    enum: ['press_kit', 'logo_package', 'photo', 'video', 'presentation'],
    description: 'Type of press material',
  })
  @IsEnum(['press_kit', 'logo_package', 'photo', 'video', 'presentation'])
  @IsNotEmpty()
  type: PressMaterialType;

  @ApiProperty({
    type: LocalizedStringDto,
    description: 'Title in multiple languages',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title: LocalizedString;

  @ApiPropertyOptional({
    type: LocalizedStringDto,
    description: 'Description in multiple languages',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedString;

  @ApiPropertyOptional({
    type: [String],
    description: 'Tags for categorization',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    description: 'Publication status',
  })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: PublicationStatus;

  @ApiPropertyOptional({
    enum: ['public', 'restricted'],
    default: 'public',
    description: 'Access level',
  })
  @IsOptional()
  @IsEnum(['public', 'restricted'])
  accessLevel?: AccessLevel;
}
