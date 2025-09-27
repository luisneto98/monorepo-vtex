import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SectionVisibility } from './system-config.schema';

export type VisibilityAuditDocument = VisibilityAudit & Document;

@Schema({ timestamps: true })
export class VisibilityAudit {
  @Prop({ type: Types.ObjectId, ref: 'SystemConfig', required: true })
  configId: Types.ObjectId;

  @Prop({ required: true })
  section: string;

  @Prop({ type: Object, required: true })
  previousState: SectionVisibility;

  @Prop({ type: Object, required: true })
  newState: SectionVisibility;

  @Prop({ required: true })
  changedBy: string;

  @Prop()
  changeReason?: string;

  @Prop()
  ipAddress?: string;
}

export const VisibilityAuditSchema = SchemaFactory.createForClass(VisibilityAudit);