export enum FileCategory {
  SPEAKER_PHOTOS = 'speaker-photos',
  LEGAL_DOCUMENTS = 'legal-documents',
  PRESS_MATERIALS = 'press-materials',
}

export interface UploadResult {
  key: string;
  url: string;
}

export interface UploadOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  scanForVirus?: boolean;
  metadata?: Record<string, string>;
}

export interface FileValidationOptions {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  validateMagicBytes?: boolean;
}

export interface MagicBytesPattern {
  mimeType: string;
  pattern: Buffer;
  offset?: number;
}
