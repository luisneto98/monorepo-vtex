import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type DownloadLogDocument = HydratedDocument<DownloadLog>;

@Schema({ collection: 'download_logs', timestamps: false })
export class DownloadLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'PressMaterial', required: true, index: true })
  materialId: Types.ObjectId;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ default: Date.now, index: true })
  downloadedAt: Date;

  @Prop({ type: String })
  userId?: string;
}

export const DownloadLogSchema = SchemaFactory.createForClass(DownloadLog);

// Create indexes for analytics queries
DownloadLogSchema.index({ materialId: 1, downloadedAt: -1 });
DownloadLogSchema.index({ downloadedAt: -1 });
