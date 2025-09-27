import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  IsNumber,
  Min,
  Max,
  MaxLength,
  MinLength,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { MultilingualTextDto } from '@common/dto/multilingual.dto';
import { SocialLinksDto } from './create-speaker.dto';

export class UpdateSpeakerDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  bio?: MultilingualTextDto;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  position?: MultilingualTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isHighlight?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
