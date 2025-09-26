import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  Session as ISession,
  SessionType,
  SessionStatus,
  SessionTranslation,
  SessionSchedule,
} from '@shared/types/session.types';

export type SessionDocument = Session & Document;

@Schema({ _id: false })
class Translation implements SessionTranslation {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

@Schema({ _id: false })
class Schedule implements SessionSchedule {
  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ required: true, type: Date })
  startTime: Date;

  @Prop({ required: true, type: Date })
  endTime: Date;

  @Prop()
  room?: string;

  @Prop()
  floor?: string;
}

@Schema({ _id: false })
class Translations {
  @Prop({ type: Translation, required: true })
  pt: Translation;

  @Prop({ type: Translation, required: true })
  en: Translation;

  @Prop({ type: Translation, required: true })
  es: Translation;
}

@Schema({ timestamps: true, collection: 'Session' })
export class Session implements Omit<ISession, '_id'> {
  @Prop({ required: true, enum: Object.values(SessionType) })
  type: SessionType;

  @Prop({ required: true, enum: Object.values(SessionStatus), default: SessionStatus.SCHEDULED })
  status: SessionStatus;

  @Prop({ type: Translations, required: true })
  translations: {
    pt: SessionTranslation;
    en: SessionTranslation;
    es: SessionTranslation;
  };

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Speaker' }], default: [] })
  speakers: string[];

  @Prop({ type: Schedule, required: true })
  schedule: SessionSchedule;

  @Prop()
  capacity?: number;

  @Prop({ default: 0 })
  registeredCount: number;

  @Prop()
  streamUrl?: string;

  @Prop()
  recordingUrl?: string;

  @Prop({ type: [String], default: [] })
  materials?: string[];

  @Prop({ default: false })
  isHighlight: boolean;

  @Prop({ default: true })
  allowQuestions: boolean;

  @Prop({ default: false })
  requiresRegistration: boolean;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ type: 1 });
SessionSchema.index({ status: 1 });
SessionSchema.index({ 'schedule.date': 1 });
SessionSchema.index({ 'schedule.startTime': 1 });
SessionSchema.index({ isHighlight: 1 });
