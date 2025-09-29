import type { BaseEntity } from './common.types';

export interface FaqCategory extends BaseEntity {
  name: {
    'pt-BR': string;
    en: string;
  };
  order: number;
  faqCount?: number;
}

export interface Faq extends BaseEntity {
  question: {
    'pt-BR': string;
    en: string;
  };
  answer: {
    'pt-BR': string;
    en: string;
  };
  category: string;
  order: number;
  viewCount: number;
  isVisible: boolean;
}
