import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LegalPageType } from '@vtexday26/shared';

export class LocalizedStringDto {
  @IsOptional()
  @IsString()
  pt?: string;

  @IsOptional()
  @IsString()
  en?: string;

  @IsOptional()
  @IsString()
  es?: string;
}

export class CreateLegalPageDto {
  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsNotEmpty()
  @IsEnum(LegalPageType)
  type: LegalPageType;

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title: LocalizedStringDto;
}
