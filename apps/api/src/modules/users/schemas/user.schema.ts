import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User as IUser, UserRole, UserProfile, UserPreferences } from '@shared/types/user.types';

export type UserDocument = User & Document;

@Schema({ _id: false })
class Profile implements UserProfile {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  company?: string;

  @Prop()
  position?: string;

  @Prop()
  bio?: string;

  @Prop()
  profileImage?: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  linkedinUrl?: string;

  @Prop()
  twitterHandle?: string;
}

@Schema({ _id: false })
class Preferences implements UserPreferences {
  @Prop({ required: true, enum: ['pt', 'en', 'es'], default: 'pt' })
  language: 'pt' | 'en' | 'es';

  @Prop({ required: true, default: 'America/Sao_Paulo' })
  timezone: string;

  @Prop({ default: true })
  emailNotifications: boolean;

  @Prop({ default: true })
  pushNotifications: boolean;

  @Prop({ default: true })
  sessionReminders: boolean;
}

@Schema({ timestamps: true, collection: 'User' })
export class User implements Omit<IUser, '_id'> {
  @Prop({ required: true, unique: true, lowercase: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: Object.values(UserRole) })
  role: UserRole;

  @Prop({ type: Profile, required: true })
  profile: UserProfile;

  @Prop({ type: Preferences, required: true })
  preferences: UserPreferences;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: Date })
  lastLogin?: Date;

  @Prop()
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'profile.company': 1 });
UserSchema.index({ isActive: 1 });
