import { BaseEntity } from './common.types';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  PRODUCER = 'producer',
  SPONSOR = 'sponsor',
  PARTICIPANT = 'participant'
}

export interface UserProfile {
  name: string;
  phone?: string;
  company?: string;
  position?: string;
  photoUrl?: string;
  language?: 'pt-BR' | 'en';
}

export interface UserPreferences {
  interests?: string[];
  notificationsEnabled?: boolean;
  favoriteSessionIds?: string[];
}

export interface User extends BaseEntity {
  email: string;
  password?: string;
  role: UserRole;
  profile: UserProfile;
  preferences: UserPreferences;
  isActive: boolean;
  isValidated: boolean;
  lastLogin?: Date;
  refreshToken?: string;
}