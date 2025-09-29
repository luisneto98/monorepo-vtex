import { IsOptional, IsObject, ValidateNested, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateSectionVisibilityDto } from './section-visibility.dto';

export class UpdateSystemConfigDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateSectionVisibilityDto)
  sections?: {
    speakers?: UpdateSectionVisibilityDto;
    sponsors?: UpdateSectionVisibilityDto;
    sessions?: UpdateSectionVisibilityDto;
    faq?: UpdateSectionVisibilityDto;
    registration?: UpdateSectionVisibilityDto;
    schedule?: UpdateSectionVisibilityDto;
  };

  @IsOptional()
  @IsString()
  changeReason?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  version?: number;
}
