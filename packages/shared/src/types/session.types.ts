import { BaseEntity } from './common.types';

export enum SessionType {
  KEYNOTE = 'keynote',
  WORKSHOP = 'workshop',
  PANEL = 'panel',
  NETWORKING = 'networking',
  BREAK = 'break'
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface SessionTranslation {
  title: string;
  description: string;
  tags: string[];
}

export interface SessionSchedule {
  date: Date;
  startTime: Date;
  endTime: Date;
  room?: string;
  floor?: string;
}

export interface Session extends BaseEntity {
  type: SessionType;
  status: SessionStatus;
  translations: {
    pt: SessionTranslation;
    en: SessionTranslation;
    es: SessionTranslation;
  };
  speakers: string[];
  schedule: SessionSchedule;
  capacity?: number;
  registeredCount: number;
  streamUrl?: string;
  recordingUrl?: string;
  materials?: string[];
  isHighlight: boolean;
  allowQuestions: boolean;
  requiresRegistration: boolean;
}