import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SupportedLanguage } from '@vtexday26/shared';

// Re-export for backward compatibility
export { SupportedLanguage };

export class UploadFileDto {
  @IsNotEmpty()
  @IsEnum(SupportedLanguage)
  language: SupportedLanguage;

  @IsNotEmpty()
  @IsString()
  uploadedBy: string;
}
