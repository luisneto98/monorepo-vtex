import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { FaqCategory as IFaqCategory } from '@shared/types/faq.types';

export type FaqCategoryDocument = FaqCategory & Document;

@Schema({ _id: false })
class Name {
  @Prop({
    required: true,
    unique: true,
    maxlength: 50,
    trim: true,
  })
  'pt-BR': string;

  @Prop({
    required: true,
    unique: true,
    maxlength: 50,
    trim: true,
  })
  'en': string;
}

@Schema({ timestamps: true, collection: 'FaqCategory' })
export class FaqCategory implements Omit<IFaqCategory, '_id'> {
  @Prop({
    type: Name,
    required: true,
  })
  name: {
    'pt-BR': string;
    en: string;
  };

  @Prop({
    required: true,
    unique: true,
    min: 0,
  })
  order: number;
}

export const FaqCategorySchema = SchemaFactory.createForClass(FaqCategory);

// Indexes
FaqCategorySchema.index({ order: 1 });
FaqCategorySchema.index({ 'name.pt-BR': 1 });
FaqCategorySchema.index({ 'name.en': 1 });

// Pre-save middleware for data normalization
FaqCategorySchema.pre('save', function (next) {
  if (this.name) {
    if (this.name['pt-BR']) {
      this.name['pt-BR'] = this.name['pt-BR'].trim();
    }
    if (this.name['en']) {
      this.name['en'] = this.name['en'].trim();
    }
  }
  next();
});

// Schema methods
FaqCategorySchema.methods['getLocalizedName'] = function (language: 'pt-BR' | 'en'): string {
  return this['name'][language] || this['name']['pt-BR'];
};
