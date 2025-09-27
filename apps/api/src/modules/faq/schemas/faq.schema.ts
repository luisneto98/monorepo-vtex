import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Faq as IFaq } from '@shared/types/faq.types';
import * as DOMPurify from 'isomorphic-dompurify';
import { FAQ_CONSTANTS } from '../faq.constants';

export type FaqDocument = Faq & Document;

@Schema({ _id: false })
class Question {
  @Prop({
    required: true,
    maxlength: FAQ_CONSTANTS.QUESTION_MAX_LENGTH,
    trim: true,
  })
  'pt-BR': string;

  @Prop({
    required: true,
    maxlength: FAQ_CONSTANTS.QUESTION_MAX_LENGTH,
    trim: true,
  })
  'en': string;
}

@Schema({ _id: false })
class Answer {
  @Prop({
    required: true,
    maxlength: FAQ_CONSTANTS.ANSWER_MAX_LENGTH,
    trim: true,
  })
  'pt-BR': string;

  @Prop({
    required: true,
    maxlength: FAQ_CONSTANTS.ANSWER_MAX_LENGTH,
    trim: true,
  })
  'en': string;
}

@Schema({ timestamps: true, collection: 'Faq' })
export class Faq implements Omit<IFaq, '_id'> {
  @Prop({
    type: Question,
    required: true,
  })
  question: {
    'pt-BR': string;
    en: string;
  };

  @Prop({
    type: Answer,
    required: true,
  })
  answer: {
    'pt-BR': string;
    en: string;
  };

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'FaqCategory',
    required: true,
    index: true,
  })
  category: string;

  @Prop({
    required: true,
    min: FAQ_CONSTANTS.ORDER_MIN_VALUE,
  })
  order: number;

  @Prop({
    default: 0,
    min: FAQ_CONSTANTS.VIEW_COUNT_MIN_VALUE,
  })
  viewCount: number;

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

export const FaqSchema = SchemaFactory.createForClass(Faq);

// Indexes
FaqSchema.index({ category: 1, order: 1 });
FaqSchema.index({ viewCount: -1 });
FaqSchema.index({ isVisible: 1 });
FaqSchema.index({ deletedAt: 1 });
// Compound index for common query pattern (category + visibility + soft delete)
FaqSchema.index({ category: 1, isVisible: 1, deletedAt: 1 });
FaqSchema.index({
  'question.pt-BR': 'text',
  'question.en': 'text',
  'answer.pt-BR': 'text',
  'answer.en': 'text',
});

// Pre-save middleware for data normalization and HTML sanitization
FaqSchema.pre('save', function (next) {
  if (this.question) {
    if (this.question['pt-BR']) {
      this.question['pt-BR'] = this.question['pt-BR'].trim();
    }
    if (this.question['en']) {
      this.question['en'] = this.question['en'].trim();
    }
  }

  if (this.answer) {
    if (this.answer['pt-BR']) {
      this.answer['pt-BR'] = sanitizeHtml(this.answer['pt-BR'].trim());
    }
    if (this.answer['en']) {
      this.answer['en'] = sanitizeHtml(this.answer['en'].trim());
    }
  }

  next();
});

// Helper function for HTML sanitization
function sanitizeHtml(html: string): string {
  const config = {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'h3',
      'h4',
      'h5',
      'h6',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  };

  return DOMPurify.sanitize(html, config);
}

// Virtual fields
FaqSchema.virtual('popularity').get(function () {
  return this.viewCount || 0;
});

// Schema methods
FaqSchema.methods['getLocalizedQuestion'] = function (language: 'pt-BR' | 'en'): string {
  return this['question'][language] || this['question']['pt-BR'];
};

FaqSchema.methods['getLocalizedAnswer'] = function (language: 'pt-BR' | 'en'): string {
  return this['answer'][language] || this['answer']['pt-BR'];
};

FaqSchema.methods['incrementViewCount'] = function (): void {
  this['viewCount'] = (this['viewCount'] || 0) + 1;
};
