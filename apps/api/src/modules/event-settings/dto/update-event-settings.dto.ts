import { PartialType } from '@nestjs/swagger';
import { CreateEventSettingsDto } from './create-event-settings.dto';

export class UpdateEventSettingsDto extends PartialType(CreateEventSettingsDto) {}
