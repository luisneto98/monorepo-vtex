import { IsBoolean, IsOptional, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '@common/dto/pagination.dto';

export class SpeakerFilterDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isHighlight?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isVisible?: boolean;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  tags?: string[];
}
