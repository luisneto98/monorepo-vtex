export type PressMaterialType = 'press_kit' | 'logo_package' | 'photo' | 'video' | 'presentation';

export type PublicationStatus = 'draft' | 'published' | 'archived';
export type AccessLevel = 'public' | 'restricted';

export interface LocalizedString {
  pt: string;
  en: string;
  es: string;
}

export interface FileMetadata {
  size: number;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface PressMaterial {
  _id?: string;
  type: PressMaterialType;
  title: LocalizedString;
  description: LocalizedString;
  fileUrl: string;
  thumbnailUrl?: string;
  metadata: FileMetadata;
  tags: string[];
  status: PublicationStatus;
  accessLevel: AccessLevel;
  downloadCount: number;
  uploadedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePressMaterialDto {
  type: PressMaterialType;
  title: LocalizedString;
  description?: LocalizedString;
  tags?: string[];
  status?: PublicationStatus;
  accessLevel?: AccessLevel;
}

export interface UpdatePressMaterialDto {
  title?: LocalizedString;
  description?: LocalizedString;
  tags?: string[];
  status?: PublicationStatus;
  accessLevel?: AccessLevel;
}

export interface PressMaterialFilters {
  type?: PressMaterialType;
  status?: PublicationStatus;
  accessLevel?: AccessLevel;
  tags?: string[];
  search?: string;
}

export interface PressMaterialPaginationDto {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'downloadCount' | 'title';
  sortOrder?: 'asc' | 'desc';
  filters?: PressMaterialFilters;
}

export interface FileUploadResponse {
  fileUrl: string;
  thumbnailUrl?: string;
  metadata: FileMetadata;
}

export interface DownloadLog {
  _id?: string;
  materialId: string;
  ipAddress: string;
  userAgent: string;
  downloadedAt: Date;
  userId?: string;
}
