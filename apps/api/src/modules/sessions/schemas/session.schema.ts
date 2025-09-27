import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Session as ISession, SessionType, SessionStage } from '@shared/types/session.types';

export type SessionDocument = Session & Document;

@Schema({ _id: false })
class Title {
  @Prop({
    required: true,
    maxlength: 150,
    trim: true,
  })
  'pt-BR': string;

  @Prop({
    required: true,
    maxlength: 150,
    trim: true,
  })
  'en': string;
}

@Schema({ _id: false })
class Description {
  @Prop({
    required: true,
    minlength: 100,
    maxlength: 1000,
    trim: true,
  })
  'pt-BR': string;

  @Prop({
    required: true,
    minlength: 100,
    maxlength: 1000,
    trim: true,
  })
  'en': string;
}

@Schema({ timestamps: true, collection: 'Session' })
export class Session implements Omit<ISession, '_id'> {
  @Prop({
    type: Title,
    required: true,
  })
  title: {
    'pt-BR': string;
    en: string;
  };

  @Prop({
    type: Description,
    required: true,
  })
  description: {
    'pt-BR': string;
    en: string;
  };

  @Prop({
    required: true,
    enum: Object.values(SessionType),
  })
  type: SessionType;

  @Prop({
    required: true,
    type: Date,
    index: true,
  })
  startTime: Date;

  @Prop({
    required: true,
    type: Date,
  })
  endTime: Date;

  @Prop({
    required: true,
    enum: Object.values(SessionStage),
    index: true,
  })
  stage: SessionStage;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Speaker' }],
    default: [],
  })
  speakerIds: string[];

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Sponsor' }],
    default: [],
  })
  sponsorIds: string[];

  @Prop({
    type: [String],
    default: [],
    index: true,
  })
  tags: string[];

  @Prop({
    min: 0,
  })
  capacity?: number;

  @Prop({
    min: 0,
    default: 0,
  })
  registeredCount: number;

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
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Indexes
SessionSchema.index({ startTime: 1 });
SessionSchema.index({ stage: 1 });
SessionSchema.index({ tags: 1 });
SessionSchema.index({ startTime: 1, stage: 1 });
SessionSchema.index({ type: 1 });
SessionSchema.index({ isHighlight: 1 });
SessionSchema.index({ isVisible: 1 });
SessionSchema.index({ deletedAt: 1 });
SessionSchema.index({
  'title.pt-BR': 'text',
  'title.en': 'text',
  'description.pt-BR': 'text',
  'description.en': 'text',
});

// Pre-save middleware for data normalization
SessionSchema.pre('save', function (next) {
  if (this.title) {
    if (this.title['pt-BR']) {
      this.title['pt-BR'] = this.title['pt-BR'].trim();
    }
    if (this.title['en']) {
      this.title['en'] = this.title['en'].trim();
    }
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
SessionSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    if (this.endTime <= this.startTime) {
      next(new Error('End time must be after start time'));
      return;
    }
  }
  next();
});

// Virtual fields
SessionSchema.virtual('duration').get(function () {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / 60000);
  }
  return 0;
});

SessionSchema.virtual('isFull').get(function () {
  if (this.capacity && this.registeredCount) {
    return this.registeredCount >= this.capacity;
  }
  return false;
});

// Schema methods
SessionSchema.methods['getLocalizedTitle'] = function (language: 'pt-BR' | 'en'): string {
  return this['title'][language] || this['title']['pt-BR'];
};

SessionSchema.methods['getLocalizedDescription'] = function (language: 'pt-BR' | 'en'): string {
  return this['description'][language] || this['description']['pt-BR'];
};

SessionSchema.methods['isLive'] = function (): boolean {
  const now = new Date();
  return this['startTime'] <= now && this['endTime'] > now;
};

SessionSchema.methods['isUpcoming'] = function (): boolean {
  const now = new Date();
  return this['startTime'] > now;
};

SessionSchema.methods['isPast'] = function (): boolean {
  const now = new Date();
  return this['endTime'] < now;
};
