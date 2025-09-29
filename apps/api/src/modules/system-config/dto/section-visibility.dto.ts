import {
  IsOptional,
  IsBoolean,
  IsObject,
  IsString,
  IsDateString,
  MaxLength,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'isWithin30Days', async: false })
class IsWithin30DaysConstraint implements ValidatorConstraintInterface {
  validate(dateString: string, _args: ValidationArguments) {
    const date = new Date(dateString);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return date > now && date <= thirtyDaysFromNow;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Scheduled activation must be between now and 30 days from now';
  }
}

class CustomMessageDto {
  @IsString()
  @MaxLength(500)
  'pt-BR': string;

  @IsString()
  @MaxLength(500)
  'en': string;
}

class ScheduledActivationDto {
  @IsDateString()
  @Validate(IsWithin30DaysConstraint)
  dateTime: string;

  @IsString()
  timezone: string;
}

export class UpdateSectionVisibilityDto {
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CustomMessageDto)
  customMessage?: CustomMessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduledActivationDto)
  scheduledActivation?: ScheduledActivationDto | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeReason?: string;
}
