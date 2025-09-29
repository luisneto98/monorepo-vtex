import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NewsReleaseAuditLogDocument = NewsReleaseAuditLog & Document;

@Schema({ _id: false })
export class PerformedBy {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  role: string;
}

@Schema({ timestamps: { createdAt: 'timestamp', updatedAt: false } })
export class NewsReleaseAuditLog {
  @Prop({ required: true, index: true })
  entityId: string;

  @Prop({ required: true, default: 'news-release' })
  entityType: string;

  @Prop({
    required: true,
    enum: ['create', 'update', 'delete', 'publish', 'archive', 'restore'],
    index: true,
  })
  action: string;

  @Prop({ type: PerformedBy, required: true })
  performedBy: PerformedBy;

  @Prop({ type: Object })
  changes?: Record<string, any>;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;
}

export const NewsReleaseAuditLogSchema = SchemaFactory.createForClass(NewsReleaseAuditLog);

NewsReleaseAuditLogSchema.index({ entityId: 1, timestamp: -1 });
NewsReleaseAuditLogSchema.index({ 'performedBy.id': 1 });
NewsReleaseAuditLogSchema.index({ action: 1 });
