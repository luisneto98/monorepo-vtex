import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, maxlength: 65 })
  title: string;

  @Prop({ required: true, maxlength: 240 })
  message: string;

  @Prop({ type: Date })
  scheduledAt?: Date;

  @Prop({ type: Date })
  sentAt?: Date;

  @Prop({
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.DRAFT,
  })
  status: NotificationStatus;

  @Prop({ required: true, default: 0 })
  deviceCount: number;

  @Prop({ default: 0 })
  deliveredCount: number;

  @Prop({ default: 0 })
  failedCount: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  segments: string[];

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for performance
NotificationSchema.index({ status: 1, scheduledAt: 1 });
NotificationSchema.index({ createdBy: 1, createdAt: -1 });
NotificationSchema.index({ sentAt: -1 });
