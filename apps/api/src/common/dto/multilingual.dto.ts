import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MultilingualTextDto {
  @ApiProperty({
    description: 'Text in Brazilian Portuguese',
    example: 'Texto em português'
  })
  @IsString()
  @IsNotEmpty()
  'pt-BR': string;

  @ApiProperty({
    description: 'Text in English',
    example: 'Text in English'
  })
  @IsString()
  @IsNotEmpty()
  en: string;

  @ApiPropertyOptional({
    description: 'Text in Spanish',
    example: 'Texto en español'
  })
  @IsOptional()
  @IsString()
  es?: string;
}
