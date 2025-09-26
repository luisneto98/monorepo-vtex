import { BaseEntity } from './common.types';

export interface SpeakerSocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  website?: string;
}

export interface Speaker extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  bio: {
    pt: string;
    en: string;
    es: string;
  };
  company: string;
  position: string;
  profileImage: string;
  socialLinks: SpeakerSocialLinks;
  sessions: string[];
  isHighlight: boolean;
  isActive: boolean;
  tags: string[];
}