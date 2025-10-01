import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Allow,
} from 'class-validator';
import { Type, Exclude } from 'class-transformer';
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

  @Allow()
  @Exclude()
  _id?: any;
}

class OptionalLocalizedStringDto implements LocalizedString {
  @ApiPropertyOptional({ description: 'Portuguese (Brazil) text' })
  @IsString()
  @IsOptional()
  pt: string;

  @ApiPropertyOptional({ description: 'English text' })
  @IsString()
  @IsOptional()
  en: string;

  @ApiPropertyOptional({ description: 'Spanish text' })
  @IsString()
  @IsOptional()
  es: string;

  @Allow()
  @Exclude()
  _id?: any;
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
    type: OptionalLocalizedStringDto,
    description: 'Description in multiple languages',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OptionalLocalizedStringDto)
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
