import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsNumber, Min, ValidateNested, IsMongoId } from 'class-validator';
import { MultilingualTextDto } from '@common/dto/multilingual.dto';

export class UpdateFaqDto {
  @ApiPropertyOptional({
    description: 'FAQ question in multiple languages',
    example: {
      'pt-BR': 'Como posso participar do evento?',
      en: 'How can I participate in the event?',
    },
    type: MultilingualTextDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  question?: MultilingualTextDto;

  @ApiPropertyOptional({
    description: 'FAQ answer in multiple languages (supports HTML)',
    example: {
      'pt-BR': '<p>Você pode se inscrever através do nosso site oficial.</p>',
      en: '<p>You can register through our official website.</p>',
    },
    type: MultilingualTextDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  answer?: MultilingualTextDto;

  @ApiPropertyOptional({
    description: 'MongoDB ID of the FAQ category',
    example: '507f1f77bcf86cd799439015',
  })
  @IsOptional()
  @IsMongoId()
  category?: string;

  @ApiPropertyOptional({
    description: 'Display order within category',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Number of times FAQ has been viewed',
    example: 150,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  viewCount?: number;

  @ApiPropertyOptional({
    description: 'FAQ visibility status',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
