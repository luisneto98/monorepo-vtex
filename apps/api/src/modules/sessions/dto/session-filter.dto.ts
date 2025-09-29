import { Type, Transform } from 'class-transformer';
import {
  IsOptional,
  IsDate,
  IsString,
  IsEnum,
  IsArray,
  IsBoolean,
  IsMongoId,
} from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { SessionType, SessionStage } from '@shared/types/session.types';

export class SessionFilterDto extends PaginationDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsEnum(SessionStage)
  stage?: SessionStage;

  @IsOptional()
  @IsEnum(SessionType)
  type?: SessionType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  tags?: string[];

  @IsOptional()
  @IsMongoId()
  speakerId?: string;

  @IsOptional()
  @IsMongoId()
  sponsorId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isHighlight?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isLive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isUpcoming?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isPast?: boolean;
}
