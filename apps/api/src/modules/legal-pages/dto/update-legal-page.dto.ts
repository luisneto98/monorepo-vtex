import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateLegalPageDto } from './create-legal-page.dto';

export class UpdateLegalPageDto extends PartialType(CreateLegalPageDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
