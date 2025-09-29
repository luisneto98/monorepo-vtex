import type { BaseEntity } from './common.types';

export interface SpeakerSocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  website?: string;
}

export interface Speaker extends BaseEntity {
  name: string;
  bio: {
    'pt-BR': string;
    en: string;
  };
  photoUrl: string;
  company: string;
  position: {
    'pt-BR': string;
    en: string;
  };
  socialLinks: SpeakerSocialLinks;
  priority: number;
  isHighlight: boolean;
  isVisible: boolean;
}

export type CreateSpeakerDto = Omit<Speaker, keyof BaseEntity | 'priority'>;
export type UpdateSpeakerDto = Partial<Omit<Speaker, keyof BaseEntity>>;
