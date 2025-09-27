import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsArray, IsBoolean, IsMongoId } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';

export class SponsorFilterDto extends PaginationDto {
  @IsOptional()
  @IsMongoId()
  tier?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isVisible?: boolean;

  @IsOptional()
  @IsString()
  standLocation?: string;
}