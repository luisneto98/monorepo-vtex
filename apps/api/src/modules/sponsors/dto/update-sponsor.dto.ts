import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsEmail,
  IsUrl,
  IsNumber,
  Min,
  MaxLength,
  ValidateNested,
  IsArray,
  IsMongoId,
  Matches,
} from 'class-validator';
import { MultilingualTextDto } from '@common/dto/multilingual.dto';
import { SponsorSocialLinksDto } from './create-sponsor.dto';

export class UpdateSponsorDto {
  @ApiPropertyOptional({
    description: 'Sponsor company name',
    example: 'VTEX',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly identifier',
    example: 'vtex',
    pattern: '^[a-z0-9-]+$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Sponsor description in multiple languages',
    example: {
      'pt-BR': 'Líder em plataforma de comércio digital',
      en: 'Leader in digital commerce platform',
    },
    type: MultilingualTextDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  description?: MultilingualTextDto;

  @ApiPropertyOptional({
    description: 'URL to sponsor logo image',
    example: 'https://cdn.vtexday.com/sponsors/vtex-logo.svg',
    format: 'url',
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ID of the sponsor tier',
    example: '507f1f77bcf86cd799439014',
  })
  @IsOptional()
  @IsMongoId()
  tier?: string;

  @ApiPropertyOptional({
    description: 'Display order within the tier',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  orderInTier?: number;

  @ApiPropertyOptional({
    description: 'Sponsor website URL',
    example: 'https://vtex.com',
    format: 'url',
  })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({
    description: 'Physical stand location at the event',
    example: 'Hall A, Stand 42',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  standLocation?: string;

  @ApiPropertyOptional({
    description: 'Admin contact email',
    example: 'admin@vtex.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @ApiPropertyOptional({
    description: 'General contact email',
    example: 'contact@vtex.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Social media profile links',
    type: SponsorSocialLinksDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SponsorSocialLinksDto)
  socialLinks?: SponsorSocialLinksDto;

  @ApiPropertyOptional({
    description: 'Maximum number of posts allowed',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPosts?: number;

  @ApiPropertyOptional({
    description: 'Number of posts already used',
    example: 3,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  postsUsed?: number;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    type: [String],
    example: ['technology', 'ecommerce', 'platform'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Sponsor visibility status',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
