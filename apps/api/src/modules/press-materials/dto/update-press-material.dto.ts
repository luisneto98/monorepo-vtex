import { PartialType } from '@nestjs/swagger';
import { CreatePressMaterialDto } from './create-press-material.dto';

export class UpdatePressMaterialDto extends PartialType(CreatePressMaterialDto) {}
