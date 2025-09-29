import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsObject,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@shared/types/user.types';

class ProfileDto {
  @ApiProperty({
    description: 'User first name',
    example: 'João',
  })
  @IsString()
  firstName!: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Silva',
  })
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({
    description: 'Company name',
    example: 'VTEX',
  })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({
    description: 'Job position',
    example: 'Software Engineer',
  })
  @IsString()
  @IsOptional()
  position?: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'newuser@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @ApiProperty({
    description: 'User password (minimum 12 characters)',
    example: 'SecurePassword123!',
    minLength: 12,
  })
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  password!: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    default: UserRole.PARTICIPANT,
    example: UserRole.PARTICIPANT,
  })
  @IsEnum(UserRole, { message: 'Invalid role' })
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    description: 'User profile information',
    type: ProfileDto,
  })
  @ValidateNested()
  @Type(() => ProfileDto)
  @IsObject()
  profile!: ProfileDto;
}
