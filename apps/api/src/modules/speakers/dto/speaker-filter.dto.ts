import { IsBoolean, IsOptional, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '@common/dto/pagination.dto';

export class SpeakerFilterDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isHighlight?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
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
