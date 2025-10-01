import { ApiProperty } from '@nestjs/swagger';
import { SponsorSocialLinks } from '@shared/types/sponsor.types';

export class PublicSponsorDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Sponsor ID' })
  _id: string;

  @ApiProperty({ example: 'VTEX', description: 'Sponsor name' })
  name: string;

  @ApiProperty({ example: 'vtex', description: 'Sponsor slug' })
  slug: string;

  @ApiProperty({
    example: { 'pt-BR': 'Plataforma de comércio digital', en: 'Digital commerce platform' },
    description: 'Sponsor description (localized)',
  })
  description: {
    'pt-BR': string;
    en: string;
  };

  @ApiProperty({
    example: 'https://cdn.vtexday.com/sponsors/vtex.png',
    description: 'Sponsor logo URL',
    required: false,
  })
  logoUrl?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Sponsor tier ID' })
  tier: string;

  @ApiProperty({ example: 1, description: 'Order within tier' })
  orderInTier: number;

  @ApiProperty({
    example: 'https://vtex.com',
    description: 'Sponsor website URL',
    required: false,
  })
  websiteUrl?: string;

  @ApiProperty({ example: 'A1', description: 'Stand location', required: false })
  standLocation?: string;

  @ApiProperty({
    example: 'contact@vtex.com',
    description: 'Public contact email',
    required: false,
  })
  contactEmail?: string;

  @ApiProperty({
    example: { linkedin: 'https://linkedin.com/company/vtex', instagram: '@vtex' },
    description: 'Social media links',
    required: false,
  })
  socialLinks?: SponsorSocialLinks;

  @ApiProperty({ example: ['technology', 'ecommerce'], description: 'Sponsor tags' })
  tags: string[];

  @ApiProperty({ example: true, description: 'Visibility status' })
  isVisible: boolean;
}
