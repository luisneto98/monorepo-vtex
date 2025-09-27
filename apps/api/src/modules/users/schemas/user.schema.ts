import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User as IUser, UserRole, UserProfile, UserPreferences } from '@shared/types/user.types';

export type UserDocument = User & Document;

@Schema({ _id: false })
class Profile implements UserProfile {
  @Prop({
    required: true,
    minlength: 3,
    maxlength: 100,
    trim: true,
  })
  name: string;

  @Prop({
    match: /^[+]?[0-9]{10,15}$/,
    trim: true,
  })
  phone?: string;

  @Prop({
    maxlength: 100,
    trim: true,
  })
  company?: string;

  @Prop({
    maxlength: 50,
    trim: true,
  })
  position?: string;

  @Prop({
    match: /^https?:\/\/.+/,
  })
  photoUrl?: string;

  @Prop({
    enum: ['pt-BR', 'en'],
    default: 'pt-BR',
  })
  language?: 'pt-BR' | 'en';
}

@Schema({ _id: false })
class Preferences implements UserPreferences {
  @Prop({
    type: [String],
    default: [],
  })
  interests?: string[];

  @Prop({
    default: true,
  })
  notificationsEnabled?: boolean;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Session' }],
    default: [],
  })
  favoriteSessionIds?: string[];
}

@Schema({ timestamps: true, collection: 'User' })
export class User implements Omit<IUser, '_id'> {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    index: true,
    trim: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  })
  email: string;

  @Prop({
    required: true,
    select: false,
  })
  password: string;

  @Prop({
    required: true,
    enum: Object.values(UserRole),
    index: true,
  })
  role: UserRole;

  @Prop({
    type: Profile,
    required: true,
  })
  profile: UserProfile;

  @Prop({
    type: Preferences,
    required: true,
    default: {},
  })
  preferences: UserPreferences;

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop({
    default: false,
    index: true,
  })
  isValidated: boolean;

  @Prop({
    type: Date,
  })
  lastLogin?: Date;

  @Prop({
    select: false,
  })
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isValidated: 1 });
UserSchema.index({ 'profile.company': 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ role: 1, isValidated: 1 });

// Pre-save middleware for data normalization
UserSchema.pre('save', function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.profile?.name) {
    this.profile.name = this.profile.name.trim();
  }
  if (this.profile?.company) {
    this.profile.company = this.profile.company.trim();
  }
  if (this.profile?.position) {
    this.profile.position = this.profile.position.trim();
  }
  next();
});

// Virtual fields
UserSchema.virtual('displayName').get(function () {
  return this.profile?.name || this.email.split('@')[0];
});

// Schema methods
UserSchema.methods['toJSON'] = function () {
  const obj = this['toObject']();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};
