import { Type } from 'class-transformer';
import { IsNumber, Min, ValidateNested, IsOptional } from 'class-validator';
import { MultilingualTextDto } from '@common/dto/multilingual.dto';

export class UpdateFaqCategoryDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  name?: MultilingualTextDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;
}
