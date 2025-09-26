import { BaseEntity } from './common.types';

export enum SponsorTier {
  DIAMOND = 'diamond',
  PLATINUM = 'platinum',
  GOLD = 'gold',
  SILVER = 'silver',
  BRONZE = 'bronze'
}

export interface SponsorContact {
  name: string;
  email: string;
  phone?: string;
  position?: string;
}

export interface SponsorBenefits {
  boothSize?: string;
  speakingSlots: number;
  workshopSlots: number;
  logoPlacement: string[];
  attendeePassCount: number;
  socialMediaMentions: number;
  postLimit: number;
}

export interface Sponsor extends BaseEntity {
  name: string;
  tier: SponsorTier;
  logo: string;
  website: string;
  description: {
    pt: string;
    en: string;
    es: string;
  };
  contact: SponsorContact;
  benefits: SponsorBenefits;
  isActive: boolean;
  contractStartDate: Date;
  contractEndDate: Date;
  amountPaid: number;
  posts: string[];
}