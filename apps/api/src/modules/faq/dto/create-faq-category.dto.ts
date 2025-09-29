import { Type } from 'class-transformer';
import { IsNumber, Min, ValidateNested } from 'class-validator';
import { MultilingualTextDto } from '@common/dto/multilingual.dto';

export class CreateFaqCategoryDto {
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

  @IsNumber()
  @Min(1)
  order: number;
}
