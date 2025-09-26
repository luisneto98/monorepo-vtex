import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Speaker as ISpeaker, SpeakerSocialLinks } from '@shared/types/speaker.types';

export type SpeakerDocument = Speaker & Document;

@Schema({ _id: false })
class SocialLinks implements SpeakerSocialLinks {
  @Prop()
  linkedin?: string;

  @Prop()
  twitter?: string;

  @Prop()
  github?: string;

  @Prop()
  website?: string;
}

@Schema({ _id: false })
class Bio {
  @Prop({ required: true })
  pt: string;

  @Prop({ required: true })
  en: string;

  @Prop({ required: true })
  es: string;
}

@Schema({ timestamps: true, collection: 'Speaker' })
export class Speaker implements Omit<ISpeaker, '_id'> {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ type: Bio, required: true })
  bio: {
    pt: string;
    en: string;
    es: string;
  };

  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  position: string;

  @Prop({ required: true })
  profileImage: string;

  @Prop({ type: SocialLinks, default: {} })
  socialLinks: SpeakerSocialLinks;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Session' }], default: [] })
  sessions: string[];

  @Prop({ default: false })
  isHighlight: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const SpeakerSchema = SchemaFactory.createForClass(Speaker);

SpeakerSchema.index({ email: 1 });
SpeakerSchema.index({ isHighlight: 1 });
SpeakerSchema.index({ isActive: 1 });
SpeakerSchema.index({ company: 1 });
