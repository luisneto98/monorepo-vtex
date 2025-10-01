import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Sponsor as ISponsor, SponsorSocialLinks } from '@shared/types/sponsor.types';

export type SponsorDocument = Sponsor & Document;

@Schema({ _id: false })
class Description {
  @Prop({
    required: true,
    maxlength: 500,
    trim: true,
  })
  'pt-BR': string;

  @Prop({
    required: true,
    maxlength: 500,
    trim: true,
  })
  'en': string;
}

@Schema({ _id: false })
class SocialLinks implements SponsorSocialLinks {
  @Prop({
    match: /^https?:\/\/(www\.)?linkedin\.com\/.+/,
  })
  linkedin?: string;

  @Prop({
    match: /^https?:\/\/(www\.)?instagram\.com\/.+/,
  })
  instagram?: string;

  @Prop({
    match: /^https?:\/\/(www\.)?facebook\.com\/.+/,
  })
  facebook?: string;
}

@Schema({ timestamps: true, collection: 'Sponsor' })
export class Sponsor implements Omit<ISponsor, '_id'> {
  @Prop({
    required: true,
    unique: true,
    maxlength: 100,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/,
  })
  slug: string;

  @Prop({
    type: Description,
    required: true,
  })
  description: {
    'pt-BR': string;
    en: string;
  };

  @Prop({
    match: /^https?:\/\/.+/,
  })
  logoUrl?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'SponsorTier',
    required: true,
    index: true,
  })
  tier: string;

  @Prop({
    required: true,
    min: 1,
  })
  orderInTier: number;

  @Prop({
    match: /^https?:\/\/.+/,
  })
  websiteUrl?: string;

  @Prop({
    maxlength: 100,
    trim: true,
  })
  standLocation?: string;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  })
  adminEmail: string;

  @Prop({
    lowercase: true,
    trim: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  })
  contactEmail?: string;

  @Prop({
    type: SocialLinks,
    default: {},
  })
  socialLinks?: SponsorSocialLinks;

  @Prop({
    min: 0,
  })
  maxPosts?: number;

  @Prop({
    default: 0,
    min: 0,
  })
  postsUsed: number;

  @Prop({
    type: [String],
    default: [],
  })
  tags: string[];

  @Prop({
    default: true,
    index: true,
  })
  isVisible: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt?: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  deletedBy?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
  })
  deleteReason?: string;
}

export const SponsorSchema = SchemaFactory.createForClass(Sponsor);

// Indexes
SponsorSchema.index({ tier: 1, orderInTier: 1 });
SponsorSchema.index({ slug: 1 });
SponsorSchema.index({ isVisible: 1 });
SponsorSchema.index({ deletedAt: 1 });
SponsorSchema.index({ tags: 1 });
SponsorSchema.index({ name: 'text', 'description.pt-BR': 'text', 'description.en': 'text' });

// Composite index for public API queries (optimizes {isVisible: true, deletedAt: null} pattern)
SponsorSchema.index({ isVisible: 1, deletedAt: 1, tier: 1, orderInTier: 1 });

// Pre-save middleware for data normalization
SponsorSchema.pre('save', function (next) {
  if (this.name) {
    this.name = this.name.trim();
  }
  if (this.slug) {
    this.slug = this.slug.toLowerCase().trim();
  }
  if (this.adminEmail) {
    this.adminEmail = this.adminEmail.toLowerCase().trim();
  }
  if (this.contactEmail) {
    this.contactEmail = this.contactEmail.toLowerCase().trim();
  }
  if (this.standLocation) {
    this.standLocation = this.standLocation.trim();
  }
  if (this.description) {
    if (this.description['pt-BR']) {
      this.description['pt-BR'] = this.description['pt-BR'].trim();
    }
    if (this.description['en']) {
      this.description['en'] = this.description['en'].trim();
    }
  }
  if (this.tags && Array.isArray(this.tags)) {
    this.tags = this.tags.map((tag) => tag.toLowerCase().trim());
  }
  next();
});

// Validation middleware
SponsorSchema.pre('save', function (next) {
  if (this.maxPosts !== undefined && this.postsUsed > this.maxPosts) {
    next(new Error('Posts used cannot exceed max posts limit'));
    return;
  }
  next();
});

// Virtual fields
SponsorSchema.virtual('postsRemaining').get(function () {
  if (this.maxPosts !== undefined) {
    return Math.max(0, this.maxPosts - this.postsUsed);
  }
  return null;
});

SponsorSchema.virtual('hasReachedPostLimit').get(function () {
  if (this.maxPosts !== undefined) {
    return this.postsUsed >= this.maxPosts;
  }
  return false;
});

// Schema methods
SponsorSchema.methods['getLocalizedDescription'] = function (language: 'pt-BR' | 'en'): string {
  return this['description'][language] || this['description']['pt-BR'];
};

SponsorSchema.methods['canCreatePost'] = function (): boolean {
  if (this['maxPosts'] === undefined) {
    return true;
  }
  return this['postsUsed'] < this['maxPosts'];
};

SponsorSchema.methods['incrementPostCount'] = function (): void {
  this['postsUsed'] = (this['postsUsed'] || 0) + 1;
};
