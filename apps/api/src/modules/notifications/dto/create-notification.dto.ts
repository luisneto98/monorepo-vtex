import {
  IsString,
  IsOptional,
  IsDate,
  IsArray,
  IsObject,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationStatus } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @IsString()
  @MaxLength(65, { message: 'Title must not exceed 65 characters' })
  title: string;

  @IsString()
  @MaxLength(240, { message: 'Message must not exceed 240 characters' })
  message: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledAt?: Date;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  segments?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
