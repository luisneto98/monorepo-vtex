import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsDate,
  IsUrl,
  ValidateNested,
  IsNotEmpty,
  MaxLength,
  MinLength,
  ArrayMaxSize,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NewsReleaseStatus } from '@vtexday26/shared';
import * as DOMPurify from 'isomorphic-dompurify';

export class LocalizedContentDto {
  @ApiProperty({ description: 'Title of the content' })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiPropertyOptional({ description: 'Subtitle of the content' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) => value?.trim())
  subtitle?: string;

  @ApiProperty({ description: 'Main content in HTML format' })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(50000)
  @Transform(({ value }) =>
    DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'a',
        'ul',
        'ol',
        'li',
        'blockquote',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'img',
        'iframe',
      ],
      ALLOWED_ATTR: [
        'href',
        'target',
        'src',
        'alt',
        'width',
        'height',
        'frameborder',
        'allowfullscreen',
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    }),
  )
  content: string;

  @ApiPropertyOptional({ description: 'SEO meta title' })
  @IsOptional()
  @IsString()
  @MaxLength(70)
  @Transform(({ value }) => value?.trim())
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'SEO meta description' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(({ value }) => value?.trim())
  metaDescription?: string;

  @ApiPropertyOptional({ description: 'SEO keywords', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @Transform(({ value }) => value?.map((k: string) => k.trim().toLowerCase()))
  keywords?: string[];
}

export class ContentDto {
  @ApiProperty({ type: LocalizedContentDto, description: 'Portuguese content' })
  @ValidateNested()
  @Type(() => LocalizedContentDto)
  @IsNotEmpty()
  'pt-BR': LocalizedContentDto;

  @ApiProperty({ type: LocalizedContentDto, description: 'English content' })
  @ValidateNested()
  @Type(() => LocalizedContentDto)
  @IsNotEmpty()
  'en': LocalizedContentDto;

  @ApiProperty({ type: LocalizedContentDto, description: 'Spanish content' })
  @ValidateNested()
  @Type(() => LocalizedContentDto)
  @IsNotEmpty()
  'es': LocalizedContentDto;
}

export class CreateNewsReleaseDto {
  @ApiProperty({ type: ContentDto, description: 'Multilingual content' })
  @ValidateNested()
  @Type(() => ContentDto)
  @IsNotEmpty()
  content: ContentDto;

  @ApiPropertyOptional({ enum: NewsReleaseStatus, default: NewsReleaseStatus.DRAFT })
  @IsOptional()
  @IsEnum(NewsReleaseStatus)
  status?: NewsReleaseStatus;

  @ApiPropertyOptional({ description: 'Is this a featured article?', default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Featured image URL' })
  @IsOptional()
  @IsUrl()
  featuredImage?: string;

  @ApiPropertyOptional({ description: 'Article categories', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  @Transform(({ value }) => value?.map((c: string) => c.trim()))
  categories?: string[];

  @ApiPropertyOptional({ description: 'Article tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @Transform(({ value }) => value?.map((t: string) => t.trim().toLowerCase()))
  tags?: string[];

  @ApiPropertyOptional({ description: 'Schedule publication date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledFor?: Date;

  @ApiPropertyOptional({ description: 'Related article IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  @Matches(/^[0-9a-fA-F]{24}$/, {
    each: true,
    message: 'Each related article must be a valid MongoDB ObjectId',
  })
  relatedArticles?: string[];
}
