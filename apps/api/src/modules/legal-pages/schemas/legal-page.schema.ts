import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  LegalPageType,
  LegalFileMetadata as FileMetadata,
  LegalLocalizedString as LocalizedString,
  LegalLocalizedFiles as LocalizedFiles,
} from '@vtexday26/shared';

export type LegalPageDocument = LegalPage & Document;

// Re-export for backward compatibility
export { LegalPageType, FileMetadata, LocalizedString, LocalizedFiles };

@Schema({ collection: 'LegalPage', timestamps: true })
export class LegalPage {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, enum: Object.values(LegalPageType), index: true })
  type: LegalPageType;

  @Prop({
    type: {
      pt: {
        filename: String,
        originalName: String,
        size: Number,
        uploadedAt: Date,
        uploadedBy: String,
      },
      en: {
        filename: String,
        originalName: String,
        size: Number,
        uploadedAt: Date,
        uploadedBy: String,
      },
      es: {
        filename: String,
        originalName: String,
        size: Number,
        uploadedAt: Date,
        uploadedBy: String,
      },
    },
  })
  files: LocalizedFiles;

  @Prop({
    type: {
      pt: String,
      en: String,
      es: String,
    },
    required: true,
  })
  title: LocalizedString;

  @Prop()
  lastModifiedBy: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const LegalPageSchema = SchemaFactory.createForClass(LegalPage);
