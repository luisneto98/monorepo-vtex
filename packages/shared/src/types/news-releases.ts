export interface LocalizedNewsContent {
  title: string;
  subtitle?: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface ImageGalleryItem {
  _id?: string;
  url: string;
  thumbnailUrl?: string;
  caption?: Record<string, string>;
  altText?: Record<string, string>;
  order: number;
  uploadedAt: Date;
}

export const NewsReleaseStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type NewsReleaseStatus = (typeof NewsReleaseStatus)[keyof typeof NewsReleaseStatus];

export interface NewsRelease {
  _id?: string;
  slug: string;
  content: {
    'pt-BR': LocalizedNewsContent;
    en: LocalizedNewsContent;
    es: LocalizedNewsContent;
  };
  status: NewsReleaseStatus;
  featured: boolean;
  featuredImage?: string;
  images: ImageGalleryItem[];
  categories: string[];
  tags: string[];
  author: {
    id: string;
    name: string;
    email: string;
  };
  publishedAt?: Date;
  scheduledFor?: Date;
  viewCount: number;
  relatedArticles?: string[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface CreateNewsReleaseDto {
  content: {
    'pt-BR': LocalizedNewsContent;
    en: LocalizedNewsContent;
    es: LocalizedNewsContent;
  };
  status?: NewsReleaseStatus;
  featured?: boolean;
  featuredImage?: string;
  categories?: string[];
  tags?: string[];
  scheduledFor?: Date;
  relatedArticles?: string[];
}

export interface UpdateNewsReleaseDto extends Partial<CreateNewsReleaseDto> {
  images?: ImageGalleryItem[];
}

export interface NewsReleaseFilter {
  status?: NewsReleaseStatus | NewsReleaseStatus[];
  featured?: boolean;
  categories?: string[];
  tags?: string[];
  author?: string;
  search?: string;
  language?: 'pt-BR' | 'en' | 'es';
  publishedAfter?: Date;
  publishedBefore?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'publishedAt' | 'viewCount' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface NewsReleaseAuditLog {
  _id?: string;
  entityId: string;
  entityType: 'news-release';
  action: 'create' | 'update' | 'delete' | 'publish' | 'archive' | 'restore';
  performedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface NewsReleaseFeed {
  title: string;
  description: string;
  link: string;
  language: string;
  copyright: string;
  lastBuildDate: Date;
  items: NewsReleaseFeedItem[];
}

export interface NewsReleaseFeedItem {
  title: string;
  description: string;
  link: string;
  guid: string;
  pubDate: Date;
  author: string;
  categories: string[];
  enclosure?: {
    url: string;
    type: string;
    length: number;
  };
}
