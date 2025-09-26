import { BaseEntity } from './common.types';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  PRODUCER = 'producer',
  SPONSOR = 'sponsor',
  PARTICIPANT = 'participant'
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  company?: string;
  position?: string;
  bio?: string;
  profileImage?: string;
  phoneNumber?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
}

export interface UserPreferences {
  language: 'pt' | 'en' | 'es';
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  sessionReminders: boolean;
}

export interface User extends BaseEntity {
  email: string;
  password?: string;
  role: UserRole;
  profile: UserProfile;
  preferences: UserPreferences;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  refreshToken?: string;
}