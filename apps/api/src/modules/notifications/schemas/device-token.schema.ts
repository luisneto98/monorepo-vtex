import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EncryptionUtil } from '@common/utils/encryption.util';

export type DeviceTokenDocument = DeviceToken & Document;

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

@Schema({ timestamps: true })
export class DeviceToken {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ required: true })
  token: string; // Stored encrypted at rest

  @Prop({
    type: String,
    enum: Object.values(Platform),
    required: true,
  })
  platform: Platform;

  @Prop()
  appVersion?: string;

  @Prop({ required: true, default: () => new Date() })
  lastActive: Date;

  @Prop({ default: false })
  isTestDevice: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);

// Encrypt token before saving
DeviceTokenSchema.pre('save', function (next) {
  if (this.isModified('token') && this.token) {
    // Only encrypt if not already encrypted (doesn't contain ':' separator)
    if (!this.token.includes(':')) {
      this.token = EncryptionUtil.encryptDeviceToken(this.token);
    }
  }
  next();
});

// Add method to get decrypted token
DeviceTokenSchema.methods['getDecryptedToken'] = function (): string {
  return EncryptionUtil.decryptDeviceToken(this['token']);
};

// Indexes for performance
DeviceTokenSchema.index({ userId: 1 });
DeviceTokenSchema.index({ token: 1 }, { unique: true });
DeviceTokenSchema.index({ isTestDevice: 1 });
DeviceTokenSchema.index({ lastActive: -1 });
