import { Type } from 'class-transformer';
import { IsString, IsNumber, Min, MaxLength, ValidateNested } from 'class-validator';
import { MultilingualTextDto } from '@common/dto/multilingual.dto';

export class CreateSponsorTierDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @ValidateNested()
  @Type(() => MultilingualTextDto)
  displayName: MultilingualTextDto;

  @IsNumber()
  @Min(1)
  order: number;

  @IsNumber()
  @Min(0)
  maxPosts: number;
}