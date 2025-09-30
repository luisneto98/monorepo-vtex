import { IsString, MaxLength, IsMongoId } from 'class-validator';

export class TestNotificationDto {
  @IsString()
  @MaxLength(65)
  title: string;

  @IsString()
  @MaxLength(240)
  message: string;

  @IsMongoId()
  deviceTokenId: string;
}
