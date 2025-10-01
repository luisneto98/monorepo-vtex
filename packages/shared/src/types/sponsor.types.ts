import type { BaseEntity } from './common.types';

export interface SponsorTier extends BaseEntity {
  name: string;
  displayName: {
    'pt-BR': string;
    en: string;
  };
  order: number;
  maxPosts: number;
}

export interface SponsorSocialLinks {
  linkedin?: string;
  instagram?: string;
  facebook?: string;
}

export interface Sponsor extends BaseEntity {
  name: string;
  slug: string;
  description: {
    'pt-BR': string;
    en: string;
  };
  logoUrl?: string;
  tier: string;
  orderInTier: number;
  websiteUrl?: string;
  standLocation?: string;
  adminEmail: string;
  contactEmail?: string;
  socialLinks?: SponsorSocialLinks;
  maxPosts?: number;
  postsUsed: number;
  tags: string[];
  isVisible: boolean;
}
