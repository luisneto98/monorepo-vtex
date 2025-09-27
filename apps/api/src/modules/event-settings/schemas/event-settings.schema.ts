import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  MultilingualText,
  VenueInfo,
  ContactInfo,
  SocialMediaLinks,
  MapCoordinates,
} from '../interfaces/event-settings.interface';

export type EventSettingsDocument = EventSettings & Document;

@Schema({ collection: 'event_settings', timestamps: true })
export class EventSettings {
  @Prop({
    type: {
      pt: { type: String, required: true },
      en: { type: String, required: true },
      es: { type: String, required: true }
    },
    required: true
  })
  eventName: MultilingualText;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop({
    type: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      complement: { type: String, required: false }
    },
    required: true
  })
  venue: VenueInfo;

  @Prop({
    type: {
      email: { type: String, required: true },
      phone: { type: String, required: true },
      whatsapp: { type: String, required: false }
    },
    required: true
  })
  contact: ContactInfo;

  @Prop({
    type: {
      instagram: { type: String, required: false },
      facebook: { type: String, required: false },
      linkedin: { type: String, required: false },
      twitter: { type: String, required: false },
      youtube: { type: String, required: false }
    },
    required: false
  })
  socialMedia?: SocialMediaLinks;

  @Prop({
    type: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 }
    },
    required: true
  })
  mapCoordinates: MapCoordinates;

  @Prop({ required: true })
  updatedBy: string;
}

export const EventSettingsSchema = SchemaFactory.createForClass(EventSettings);

// Create indexes for better performance
EventSettingsSchema.index({ updatedAt: -1 });
EventSettingsSchema.index({ 'eventName.pt': 'text', 'eventName.en': 'text', 'eventName.es': 'text' });