import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsBoolean, IsMongoId } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';

export class FaqFilterDto extends PaginationDto {
  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isVisible?: boolean;

  @IsOptional()
  @IsString()
  lang?: string;
}
