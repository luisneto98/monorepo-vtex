import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NewsReleaseStatus, LocalizedNewsContent, ImageGalleryItem } from '@vtexday26/shared';

export type NewsReleaseDocument = NewsRelease & Document;

@Schema({ _id: false })
export class LocalizedContent implements LocalizedNewsContent {
  @Prop({ required: true })
  title: string;

  @Prop()
  subtitle?: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  metaTitle?: string;

  @Prop()
  metaDescription?: string;

  @Prop([String])
  keywords?: string[];
}

export const LocalizedContentSchema = SchemaFactory.createForClass(LocalizedContent);

@Schema({ _id: false })
export class ImageGallery implements ImageGalleryItem {
  @Prop()
  _id?: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  thumbnailUrl?: string;

  @Prop({ type: Object })
  caption?: Record<string, string>;

  @Prop({ type: Object })
  altText?: Record<string, string>;

  @Prop({ required: true })
  order: number;

  @Prop({ default: Date.now })
  uploadedAt: Date;
}

export const ImageGallerySchema = SchemaFactory.createForClass(ImageGallery);

@Schema({ _id: false })
export class Author {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);

@Schema({ timestamps: true, versionKey: 'version' })
export class NewsRelease {
  @Prop({
    unique: true,
    required: true,
    index: true,
  })
  slug: string;

  @Prop({
    type: {
      'pt-BR': { type: LocalizedContentSchema, required: true },
      en: { type: LocalizedContentSchema, required: true },
      es: { type: LocalizedContentSchema, required: true },
    },
    _id: false,
    required: true,
  })
  content: {
    'pt-BR': LocalizedContent;
    en: LocalizedContent;
    es: LocalizedContent;
  };

  @Prop({
    type: String,
    enum: Object.values(NewsReleaseStatus),
    default: NewsReleaseStatus.DRAFT,
    index: true,
  })
  status: NewsReleaseStatus;

  @Prop({ default: false, index: true })
  featured: boolean;

  @Prop()
  featuredImage?: string;

  @Prop({ type: [ImageGallerySchema], default: [] })
  images: ImageGallery[];

  @Prop([String])
  categories: string[];

  @Prop({ type: [String], index: true })
  tags: string[];

  @Prop({ type: AuthorSchema, required: true })
  author: Author;

  @Prop({ index: true })
  publishedAt?: Date;

  @Prop()
  scheduledFor?: Date;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop([String])
  relatedArticles?: string[];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ default: 0 })
  version: number;

  // Timestamps are automatically added by Mongoose when timestamps: true
  createdAt?: Date;
  updatedAt?: Date;
}

export const NewsReleaseSchema = SchemaFactory.createForClass(NewsRelease);

// Compound indexes for common queries
NewsReleaseSchema.index({ status: 1, publishedAt: -1 });
NewsReleaseSchema.index({ status: 1, featured: 1, publishedAt: -1 });
NewsReleaseSchema.index({ isDeleted: 1, status: 1, publishedAt: -1 });

// Full text search index with weights for better relevance
NewsReleaseSchema.index(
  {
    'content.pt-BR.title': 'text',
    'content.en.title': 'text',
    'content.es.title': 'text',
    'content.pt-BR.subtitle': 'text',
    'content.en.subtitle': 'text',
    'content.es.subtitle': 'text',
    'content.pt-BR.content': 'text',
    'content.en.content': 'text',
    'content.es.content': 'text',
    'content.pt-BR.keywords': 'text',
    'content.en.keywords': 'text',
    'content.es.keywords': 'text',
    tags: 'text',
    categories: 'text',
  },
  {
    weights: {
      'content.pt-BR.title': 10,
      'content.en.title': 10,
      'content.es.title': 10,
      'content.pt-BR.subtitle': 5,
      'content.en.subtitle': 5,
      'content.es.subtitle': 5,
      'content.pt-BR.keywords': 3,
      'content.en.keywords': 3,
      'content.es.keywords': 3,
      tags: 3,
      categories: 2,
      'content.pt-BR.content': 1,
      'content.en.content': 1,
      'content.es.content': 1,
    },
    name: 'news_search_index',
    default_language: 'english',
    language_override: 'language',
  },
);

// Multikey indexes for array fields
NewsReleaseSchema.index({ tags: 1 });
NewsReleaseSchema.index({ categories: 1 });
NewsReleaseSchema.index({ tags: 1, categories: 1 });

// Single field indexes for sorting and filtering
NewsReleaseSchema.index({ createdAt: -1 });
NewsReleaseSchema.index({ updatedAt: -1 });
NewsReleaseSchema.index({ viewCount: -1 });
NewsReleaseSchema.index({ publishedAt: -1 });
NewsReleaseSchema.index({ scheduledFor: 1 });

// Partial indexes for performance optimization
NewsReleaseSchema.index(
  { featured: 1, publishedAt: -1 },
  { partialFilterExpression: { featured: true, status: NewsReleaseStatus.PUBLISHED } },
);

// Index for soft delete queries
NewsReleaseSchema.index(
  { isDeleted: 1, status: 1 },
  { partialFilterExpression: { isDeleted: false } },
);
