import { IsArray, IsString } from 'class-validator';

export class ReorderTiersDto {
  @IsArray()
  @IsString({ each: true })
  tierIds: string[];
}
