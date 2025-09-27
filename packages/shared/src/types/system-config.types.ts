import type { BaseEntity } from './common.types';

export interface SystemConfig extends BaseEntity {
  sections: {
    speakers: SectionVisibility;
    sponsors: SectionVisibility;
    sessions: SectionVisibility;
    faq: SectionVisibility;
    registration: SectionVisibility;
    schedule: SectionVisibility;
  };
  lastModifiedBy: string;
  version: number;
}

export interface SectionVisibility {
  isVisible: boolean;
  customMessage?: {
    'pt-BR': string;
    'en': string;
  };
  scheduledActivation?: {
    dateTime: Date;
    timezone: string;
  };
  lastChanged: Date;
  changedBy: string;
  changeReason?: string;
}

export interface VisibilityAuditLog extends BaseEntity {
  configId: string;
  section: string;
  previousState: SectionVisibility;
  newState: SectionVisibility;
  changedBy: string;
  changeReason?: string;
  ipAddress?: string;
}

export type SectionName = keyof SystemConfig['sections'];

export interface UpdateSectionVisibilityDto {
  isVisible?: boolean;
  customMessage?: {
    'pt-BR': string;
    'en': string;
  };
  scheduledActivation?: {
    dateTime: string;
    timezone: string;
  } | null;
  changeReason?: string;
}

export interface UpdateSystemConfigDto {
  sections: Partial<{
    [K in SectionName]: UpdateSectionVisibilityDto;
  }>;
}