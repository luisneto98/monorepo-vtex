import { Type } from 'class-transformer';
import { IsString, IsNumber, Min, MaxLength, ValidateNested, IsOptional } from 'class-validator';
import { MultilingualTextDto } from '@common/dto/multilingual.dto';

export class UpdateSponsorTierDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  displayName?: MultilingualTextDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPosts?: number;
}
