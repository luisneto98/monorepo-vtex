import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SponsorTier as ISponsorTier } from '@shared/types/sponsor.types';

export type SponsorTierDocument = SponsorTier & Document;

@Schema({ _id: false })
class DisplayName {
  @Prop({
    required: true,
    trim: true,
    maxlength: 50,
  })
  'pt-BR': string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 50,
  })
  'en': string;
}

@Schema({ timestamps: true, collection: 'SponsorTier' })
export class SponsorTier implements Omit<ISponsorTier, '_id'> {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    maxlength: 50,
  })
  name: string;

  @Prop({
    type: DisplayName,
    required: true,
  })
  displayName: {
    'pt-BR': string;
    en: string;
  };

  @Prop({
    required: true,
    unique: true,
    min: 1,
  })
  order: number;

  @Prop({
    required: true,
    min: 0,
    default: 5,
  })
  maxPosts: number;
}

export const SponsorTierSchema = SchemaFactory.createForClass(SponsorTier);

// Indexes
SponsorTierSchema.index({ order: 1 });
SponsorTierSchema.index({ name: 1 });

// Pre-save middleware for data normalization
SponsorTierSchema.pre('save', function (next) {
  if (this.name) {
    this.name = this.name.trim();
  }
  if (this.displayName) {
    if (this.displayName['pt-BR']) {
      this.displayName['pt-BR'] = this.displayName['pt-BR'].trim();
    }
    if (this.displayName['en']) {
      this.displayName['en'] = this.displayName['en'].trim();
    }
  }
  next();
});

// Schema methods
SponsorTierSchema.methods['getLocalizedName'] = function (language: 'pt-BR' | 'en'): string {
  return this['displayName'][language] || this['displayName']['pt-BR'];
};
