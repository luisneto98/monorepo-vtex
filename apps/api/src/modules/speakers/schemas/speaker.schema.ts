import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Speaker as ISpeaker, SpeakerSocialLinks } from '@shared/types/speaker.types';

export type SpeakerDocument = Speaker & Document;

@Schema({ _id: false })
class SocialLinks implements SpeakerSocialLinks {
  @Prop({
    match: /^https?:\/\/(www\.)?linkedin\.com\/.+/,
  })
  linkedin?: string;

  @Prop({
    match: /^https?:\/\/(www\.)?twitter\.com\/.+/,
  })
  twitter?: string;

  @Prop({
    match: /^https?:\/\/github\.com\/.+/,
  })
  github?: string;

  @Prop({
    match: /^https?:\/\/.+/,
  })
  website?: string;
}

@Schema({ _id: false })
class Bio {
  @Prop({
    required: true,
    minlength: 100,
    maxlength: 500,
    trim: true,
  })
  'pt-BR': string;

  @Prop({
    required: true,
    minlength: 100,
    maxlength: 500,
    trim: true,
  })
  'en': string;
}

@Schema({ _id: false })
class Position {
  @Prop({
    required: true,
    trim: true,
    maxlength: 100,
  })
  'pt-BR': string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 100,
  })
  'en': string;
}

@Schema({ timestamps: true, collection: 'Speaker' })
export class Speaker implements Omit<ISpeaker, '_id'> {
  @Prop({
    required: true,
    minlength: 3,
    maxlength: 100,
    trim: true,
  })
  name: string;

  @Prop({
    type: Bio,
    required: true,
  })
  bio: {
    'pt-BR': string;
    en: string;
  };

  @Prop({
    required: true,
    match: /^https?:\/\/.+/,
  })
  photoUrl: string;

  @Prop({
    required: true,
    maxlength: 100,
    trim: true,
  })
  company: string;

  @Prop({
    type: Position,
    required: true,
  })
  position: {
    'pt-BR': string;
    en: string;
  };

  @Prop({
    type: SocialLinks,
    default: {},
  })
  socialLinks: SpeakerSocialLinks;

  @Prop({
    default: 100,
    min: 0,
  })
  priority: number;

  @Prop({
    default: false,
  })
  isHighlight: boolean;

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

  @Prop({
    type: [String],
    default: [],
  })
  tags?: string[];
}

export const SpeakerSchema = SchemaFactory.createForClass(Speaker);

// Indexes
SpeakerSchema.index({ name: 'text' });
SpeakerSchema.index({ isVisible: 1, priority: 1 });
SpeakerSchema.index({ isHighlight: 1 });
SpeakerSchema.index({ company: 1 });
SpeakerSchema.index({ priority: 1 });
SpeakerSchema.index({ deletedAt: 1 });
SpeakerSchema.index({ tags: 1 });

// Pre-save middleware for data normalization
SpeakerSchema.pre('save', function (next) {
  if (this.name) {
    this.name = this.name.trim();
  }
  if (this.company) {
    this.company = this.company.trim();
  }
  if (this.bio) {
    if (this.bio['pt-BR']) {
      this.bio['pt-BR'] = this.bio['pt-BR'].trim();
    }
    if (this.bio['en']) {
      this.bio['en'] = this.bio['en'].trim();
    }
  }
  if (this.position) {
    if (this.position['pt-BR']) {
      this.position['pt-BR'] = this.position['pt-BR'].trim();
    }
    if (this.position['en']) {
      this.position['en'] = this.position['en'].trim();
    }
  }
  next();
});

// Virtual fields
SpeakerSchema.virtual('displayPriority').get(function () {
  return this.isHighlight ? 0 : this.priority;
});

// Schema methods
SpeakerSchema.methods['getLocalizedBio'] = function (language: 'pt-BR' | 'en'): string {
  return this['bio'][language] || this['bio']['pt-BR'];
};

SpeakerSchema.methods['getLocalizedPosition'] = function (language: 'pt-BR' | 'en'): string {
  return this['position'][language] || this['position']['pt-BR'];
};
