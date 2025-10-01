import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class SponsorSocialLinksDto {
  @ApiPropertyOptional({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/company/vtex',
    pattern: '^https?:\\/\\/(www\\.)?linkedin\\.com\\/.+',
  })
  @IsOptional()
  @IsUrl()
  @Matches(/^https?:\/\/(www\.)?linkedin\.com\/.+/)
  linkedin?: string;

  @ApiPropertyOptional({
    description: 'Instagram profile URL',
    example: 'https://instagram.com/vtexbr',
    pattern: '^https?:\\/\\/(www\\.)?instagram\\.com\\/.+',
  })
  @IsOptional()
  @IsUrl()
  @Matches(/^https?:\/\/(www\.)?instagram\.com\/.+/)
  instagram?: string;

  @ApiPropertyOptional({
    description: 'Facebook profile URL',
    example: 'https://facebook.com/vtexbr',
    pattern: '^https?:\\/\\/(www\\.)?facebook\\.com\\/.+',
  })
  @IsOptional()
  @IsUrl()
  @Matches(/^https?:\/\/(www\.)?facebook\.com\/.+/)
  facebook?: string;
}

export class CreateSponsorDto {
  @ApiProperty({
    description: 'Sponsor company name',
    example: 'VTEX',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'URL-friendly identifier',
    example: 'vtex',
    pattern: '^[a-z0-9-]+$',
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug: string;

  @ApiProperty({
    description: 'Sponsor description in multiple languages',
    example: {
      'pt-BR': 'Líder em plataforma de comércio digital',
      en: 'Leader in digital commerce platform',
    },
    type: MultilingualTextDto,
  })
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  description: MultilingualTextDto;

  @ApiPropertyOptional({
    description: 'URL to sponsor logo image',
    example: 'https://cdn.vtexday.com/sponsors/vtex-logo.svg',
    format: 'url',
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({
    description: 'MongoDB ID of the sponsor tier',
    example: '507f1f77bcf86cd799439014',
  })
  @IsMongoId()
  tier: string;

  @ApiProperty({
    description: 'Display order within the tier',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  orderInTier: number;

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

  @ApiProperty({
    description: 'Admin contact email',
    example: 'admin@vtex.com',
    format: 'email',
  })
  @IsEmail()
  adminEmail: string;

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
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
