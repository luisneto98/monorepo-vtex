import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  ValidateNested,
  IsDateString,
  IsNumber,
  Min,
  Max,
  Matches,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class MultilingualTextDto {
  @ApiProperty({ description: 'Portuguese text' })
  @IsNotEmpty()
  @IsString()
  pt: string;

  @ApiProperty({ description: 'English text' })
  @IsNotEmpty()
  @IsString()
  en: string;

  @ApiProperty({ description: 'Spanish text' })
  @IsNotEmpty()
  @IsString()
  es: string;
}

class VenueInfoDto {
  @ApiProperty({ description: 'Venue name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Street address' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'City' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ description: 'State' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ description: 'ZIP code' })
  @IsNotEmpty()
  @IsString()
  zipCode: string;

  @ApiPropertyOptional({ description: 'Address complement' })
  @IsOptional()
  @IsString()
  complement?: string;
}

class ContactInfoDto {
  @ApiProperty({ description: 'Contact email' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contact phone' })
  @IsNotEmpty()
  @Matches(/^\+?[0-9\s\-()]+$/, {
    message: 'Invalid phone number format',
  })
  phone: string;

  @ApiPropertyOptional({ description: 'WhatsApp number' })
  @IsOptional()
  @Matches(/^\+?[0-9\s\-()]+$/, {
    message: 'Invalid WhatsApp number format',
  })
  whatsapp?: string;
}

class SocialMediaLinksDto {
  @ApiPropertyOptional({ description: 'Instagram URL' })
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @ApiPropertyOptional({ description: 'Facebook URL' })
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiPropertyOptional({ description: 'LinkedIn URL' })
  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @ApiPropertyOptional({ description: 'Twitter URL' })
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiPropertyOptional({ description: 'YouTube URL' })
  @IsOptional()
  @IsUrl()
  youtube?: string;
}

class MapCoordinatesDto {
  @ApiProperty({ description: 'Latitude', minimum: -90, maximum: 90 })
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude', minimum: -180, maximum: 180 })
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

export class CreateEventSettingsDto {
  @ApiProperty({ description: 'Event name in multiple languages', type: MultilingualTextDto })
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  eventName: MultilingualTextDto;

  @ApiProperty({ description: 'Event start date', type: String, format: 'date-time' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Event end date', type: String, format: 'date-time' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Venue information', type: VenueInfoDto })
  @ValidateNested()
  @Type(() => VenueInfoDto)
  venue: VenueInfoDto;

  @ApiProperty({ description: 'Contact information', type: ContactInfoDto })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact: ContactInfoDto;

  @ApiPropertyOptional({ description: 'Social media links', type: SocialMediaLinksDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaLinksDto)
  socialMedia?: SocialMediaLinksDto;

  @ApiProperty({ description: 'Map coordinates', type: MapCoordinatesDto })
  @ValidateNested()
  @Type(() => MapCoordinatesDto)
  mapCoordinates: MapCoordinatesDto;
}
