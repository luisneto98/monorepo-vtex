import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import {
  PressMaterialType,
  LocalizedString,
  FileMetadata,
  PublicationStatus,
  AccessLevel,
} from '@vtexday26/shared';

export type PressMaterialDocument = HydratedDocument<PressMaterial>;

@Schema({ collection: 'press_materials', timestamps: true })
export class PressMaterial extends Document {
  @Prop({
    type: String,
    enum: ['press_kit', 'logo_package', 'photo', 'video', 'presentation'],
    required: true,
    index: true,
  })
  type: PressMaterialType;

  @Prop({
    type: {
      pt: { type: String, required: true },
      en: { type: String, required: true },
      es: { type: String, required: true },
    },
    required: true,
  })
  title: LocalizedString;

  @Prop({
    type: {
      pt: { type: String, default: '' },
      en: { type: String, default: '' },
      es: { type: String, default: '' },
    },
  })
  description: LocalizedString;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ type: String })
  thumbnailUrl?: string;

  @Prop({
    type: {
      size: { type: Number, required: true },
      format: { type: String, required: true },
      width: { type: Number },
      height: { type: Number },
      duration: { type: Number },
    },
    required: true,
  })
  metadata: FileMetadata;

  @Prop({ type: [String], index: true, default: [] })
  tags: string[];

  @Prop({
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  })
  status: PublicationStatus;

  @Prop({
    type: String,
    enum: ['public', 'restricted'],
    default: 'public',
    index: true,
  })
  accessLevel: AccessLevel;

  @Prop({ default: 0 })
  downloadCount: number;

  @Prop({ required: true })
  uploadedBy: string;
}

export const PressMaterialSchema = SchemaFactory.createForClass(PressMaterial);

// Create compound indexes for better query performance
PressMaterialSchema.index({ status: 1, accessLevel: 1, type: 1 });
PressMaterialSchema.index({
  'title.pt': 'text',
  'title.en': 'text',
  'title.es': 'text',
  tags: 'text',
});
PressMaterialSchema.index({ createdAt: -1 });
PressMaterialSchema.index({ downloadCount: -1 });
