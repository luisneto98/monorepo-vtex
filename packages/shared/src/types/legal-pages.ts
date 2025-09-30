export enum SupportedLanguage {
  PT = 'pt',
  EN = 'en',
  ES = 'es',
}

export enum LegalPageType {
  TERMS = 'terms',
  PRIVACY = 'privacy',
  COOKIES = 'cookies',
  OTHER = 'other',
}

export interface LegalFileMetadata {
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface LegalLocalizedString {
  pt?: string;
  en?: string;
  es?: string;
}

export interface LegalLocalizedFiles {
  pt?: LegalFileMetadata;
  en?: LegalFileMetadata;
  es?: LegalFileMetadata;
}

export interface LegalPageData {
  slug: string;
  type: LegalPageType;
  title: LegalLocalizedString;
  files?: LegalLocalizedFiles;
  isActive: boolean;
  lastModifiedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PublicLegalPage {
  slug: string;
  type: LegalPageType;
  title: LegalLocalizedString;
  availableLanguages: string[];
}

// Re-export with original names for backward compatibility
export type FileMetadata = LegalFileMetadata;
export type LocalizedString = LegalLocalizedString;
export type LocalizedFiles = LegalLocalizedFiles;
