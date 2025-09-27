import type { BaseEntity } from './common.types';

export const SessionType = {
  KEYNOTE: 'keynote',
  TALK: 'talk',
  PANEL: 'panel',
  WORKSHOP: 'workshop',
  NETWORKING: 'networking',
  BREAK: 'break'
} as const;

export type SessionType = typeof SessionType[keyof typeof SessionType];

export const SessionStage = {
  PRINCIPAL: 'principal',
  INOVACAO: 'inovacao',
  TECH: 'tech',
  STARTUP: 'startup',
  WORKSHOP_A: 'workshop_a',
  WORKSHOP_B: 'workshop_b'
} as const;

export type SessionStage = typeof SessionStage[keyof typeof SessionStage];

export interface SessionTranslation {
  title: string;
  description: string;
}


export interface ISession extends Omit<BaseEntity, '_id'> {
  _id: string;
  title: {
    'pt-BR': string;
    'en': string;
  };
  description: {
    'pt-BR': string;
    'en': string;
  };
  type?: SessionType;
  startTime: Date;
  endTime: Date;
  stage: string; // Changed from SessionStage enum to string for flexibility
  speakerIds: string[];
  sponsorIds?: string[];
  tags: string[];
  capacity?: number;
  registeredCount?: number;
  isHighlight: boolean;
  isVisible: boolean;
  technicalLevel?: 'beginner' | 'intermediate' | 'advanced';
  language?: 'pt-BR' | 'en' | 'es';
  streamUrl?: string;
  materials?: {
    title: string;
    url: string;
    type: 'pdf' | 'video' | 'link';
  }[];
}

// Alias for backwards compatibility
export type Session = ISession;

// Response types for API
export interface ISessionResponse {
  success: boolean;
  data: ISession;
}

export interface ISessionListResponse {
  success: boolean;
  data: ISession[];
  metadata?: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}