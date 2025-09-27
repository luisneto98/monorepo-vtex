import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MultilingualTextDto } from '@common/dto/multilingual.dto';

export class SocialLinksDto {
  @ApiPropertyOptional({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/carlos-silva',
    format: 'url'
  })
  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @ApiPropertyOptional({
    description: 'Twitter/X profile URL',
    example: 'https://twitter.com/carlossilva',
    format: 'url'
  })
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiPropertyOptional({
    description: 'GitHub profile URL',
    example: 'https://github.com/carlossilva',
    format: 'url'
  })
  @IsOptional()
  @IsUrl()
  github?: string;

  @ApiPropertyOptional({
    description: 'Personal website URL',
    example: 'https://carlossilva.com',
    format: 'url'
  })
  @IsOptional()
  @IsUrl()
  website?: string;
}

export class CreateSpeakerDto {
  @ApiProperty({
    description: 'Speaker full name',
    example: 'Carlos Eduardo Silva',
    minLength: 3,
    maxLength: 100
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Speaker biography in multiple languages',
    type: MultilingualTextDto,
    example: {
      'pt-BR': 'Carlos é um especialista em tecnologia com mais de 15 anos de experiência...',
      'en': 'Carlos is a technology specialist with over 15 years of experience...'
    }
  })
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  bio: MultilingualTextDto;

  @ApiProperty({
    description: 'URL to speaker photo',
    example: 'https://cdn.vtexday.com/speakers/carlos-silva.jpg',
    format: 'url'
  })
  @IsUrl()
  photoUrl: string;

  @ApiProperty({
    description: 'Speaker company',
    example: 'VTEX',
    maxLength: 100
  })
  @IsString()
  @MaxLength(100)
  company: string;

  @ApiProperty({
    description: 'Speaker position/title in multiple languages',
    type: MultilingualTextDto,
    example: {
      'pt-BR': 'Diretor de Tecnologia',
      'en': 'Chief Technology Officer'
    }
  })
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  position: MultilingualTextDto;

  @ApiPropertyOptional({
    description: 'Social media links',
    type: SocialLinksDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @ApiPropertyOptional({
    description: 'Mark speaker as highlighted',
    default: false,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isHighlight?: boolean;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    example: ['AI', 'E-commerce', 'Innovation'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Speaker visibility status',
    default: true,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
