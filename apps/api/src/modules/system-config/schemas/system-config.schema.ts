import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemConfigDocument = SystemConfig & Document;

@Schema()
export class SectionVisibility {
  @Prop({ required: true, default: true })
  isVisible: boolean;

  @Prop({ type: Object })
  customMessage?: {
    'pt-BR': string;
    'en': string;
  };

  @Prop({ type: Object })
  scheduledActivation?: {
    dateTime: Date;
    timezone: string;
  };

  @Prop({ required: true })
  lastChanged: Date;

  @Prop({ required: true })
  changedBy: string;

  @Prop()
  changeReason?: string;
}

@Schema({ timestamps: true })
export class SystemConfig {
  @Prop({ type: Object, required: true })
  sections: {
    speakers: SectionVisibility;
    sponsors: SectionVisibility;
    sessions: SectionVisibility;
    faq: SectionVisibility;
    registration: SectionVisibility;
    schedule: SectionVisibility;
  };

  @Prop({ required: true })
  lastModifiedBy: string;

  @Prop({ required: true, default: 1 })
  version: number;
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);