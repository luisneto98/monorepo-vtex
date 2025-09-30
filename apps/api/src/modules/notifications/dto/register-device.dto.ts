import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Platform } from '../schemas/device-token.schema';

export class RegisterDeviceDto {
  @IsString()
  token: string;

  @IsEnum(Platform)
  platform: Platform;

  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsBoolean()
  isTestDevice?: boolean;
}
