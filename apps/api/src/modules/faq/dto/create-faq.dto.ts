import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsNumber,
  Min,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { MultilingualTextDto } from '@common/dto/multilingual.dto';

export class CreateFaqDto {
  @ApiProperty({
    description: 'FAQ question in multiple languages',
    example: {
      'pt-BR': 'Como posso participar do evento?',
      'en': 'How can I participate in the event?'
    },
    type: MultilingualTextDto
  })
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  question: MultilingualTextDto;

  @ApiProperty({
    description: 'FAQ answer in multiple languages (supports HTML)',
    example: {
      'pt-BR': '<p>Você pode se inscrever através do nosso site oficial.</p>',
      'en': '<p>You can register through our official website.</p>'
    },
    type: MultilingualTextDto
  })
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  answer: MultilingualTextDto;

  @ApiProperty({
    description: 'MongoDB ID of the FAQ category',
    example: '507f1f77bcf86cd799439015'
  })
  @IsMongoId()
  category: string;

  @ApiProperty({
    description: 'Display order within category',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiPropertyOptional({
    description: 'FAQ visibility status',
    type: Boolean,
    default: true,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}