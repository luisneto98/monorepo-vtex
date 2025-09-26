import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  Sponsor as ISponsor,
  SponsorTier,
  SponsorContact,
  SponsorBenefits,
} from '@shared/types/sponsor.types';

export type SponsorDocument = Sponsor & Document;

@Schema({ _id: false })
class Contact implements SponsorContact {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop()
  position?: string;
}

@Schema({ _id: false })
class Benefits implements SponsorBenefits {
  @Prop()
  boothSize?: string;

  @Prop({ required: true, default: 0 })
  speakingSlots: number;

  @Prop({ required: true, default: 0 })
  workshopSlots: number;

  @Prop({ type: [String], default: [] })
  logoPlacement: string[];

  @Prop({ required: true, default: 0 })
  attendeePassCount: number;

  @Prop({ required: true, default: 0 })
  socialMediaMentions: number;

  @Prop({ required: true, default: 0 })
  postLimit: number;
}

@Schema({ _id: false })
class Description {
  @Prop({ required: true })
  pt: string;

  @Prop({ required: true })
  en: string;

  @Prop({ required: true })
  es: string;
}

@Schema({ timestamps: true, collection: 'Sponsor' })
export class Sponsor implements Omit<ISponsor, '_id'> {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, enum: Object.values(SponsorTier) })
  tier: SponsorTier;

  @Prop({ required: true })
  logo: string;

  @Prop({ required: true })
  website: string;

  @Prop({ type: Description, required: true })
  description: {
    pt: string;
    en: string;
    es: string;
  };

  @Prop({ type: Contact, required: true })
  contact: SponsorContact;

  @Prop({ type: Benefits, required: true })
  benefits: SponsorBenefits;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true, type: Date })
  contractStartDate: Date;

  @Prop({ required: true, type: Date })
  contractEndDate: Date;

  @Prop({ required: true, default: 0 })
  amountPaid: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Post' }], default: [] })
  posts: string[];
}

export const SponsorSchema = SchemaFactory.createForClass(Sponsor);

SponsorSchema.index({ tier: 1 });
SponsorSchema.index({ isActive: 1 });
SponsorSchema.index({ name: 1 });
