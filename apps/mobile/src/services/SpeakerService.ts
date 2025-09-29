import { Speaker, ISession } from '@monorepo-vtex/shared';
import apiService from './api';

interface SpeakerResponse {
  success: boolean;
  data: {
    _id: string;
    name: string;
    bio: { 'pt-BR': string; en: string };
    photoUrl: string;
    company: string;
    position: { 'pt-BR': string; en: string };
    socialLinks: {
      linkedin?: string;
      twitter?: string;
      github?: string;
      website?: string;
    };
    priority: number;
    isHighlight: boolean;
    isVisible: boolean;
  };
}

interface SessionListResponse {
  success: boolean;
  data: {
    _id: string;
    title: { 'pt-BR': string; en: string };
    description: { 'pt-BR': string; en: string };
    type?: string;
    startTime: string;
    endTime: string;
    stage: string;
    speakerIds: string[];
    tags: string[];
    isHighlight: boolean;
    isVisible: boolean;
    technicalLevel?: 'beginner' | 'intermediate' | 'advanced';
    language?: 'pt-BR' | 'en' | 'es';
  }[];
  metadata?: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface CachedSpeaker {
  speaker: Speaker;
  timestamp: number;
}

interface CachedSpeakerSessions {
  sessions: ISession[];
  timestamp: number;
}

class SpeakerService {
  private speakerCache: Map<string, CachedSpeaker> = new Map();
  private sessionsCache: Map<string, CachedSpeakerSessions> = new Map();
  private readonly SPEAKER_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly SESSIONS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private isCacheValid(timestamp: number, duration: number): boolean {
    return Date.now() - timestamp < duration;
  }

  async getSpeakerById(speakerId: string): Promise<Speaker> {
    // Check cache first
    const cached = this.speakerCache.get(speakerId);
    if (cached && this.isCacheValid(cached.timestamp, this.SPEAKER_CACHE_DURATION)) {
      console.log(`📦 Cache hit for speaker ${speakerId}`);
      return cached.speaker;
    }

    try {
      console.log(`🌐 Fetching speaker ${speakerId}`);
      const response = await apiService.get<SpeakerResponse>(
        `/speakers/${speakerId}`
      );

      if (!response.success || !response.data) {
        throw new Error('Palestrante não encontrado');
      }

      const speaker: Speaker = {
        _id: response.data._id,
        name: response.data.name,
        bio: response.data.bio,
        photoUrl: response.data.photoUrl,
        company: response.data.company,
        position: response.data.position,
        socialLinks: response.data.socialLinks,
        priority: response.data.priority,
        isHighlight: response.data.isHighlight,
        isVisible: response.data.isVisible,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Cache the result
      this.speakerCache.set(speakerId, {
        speaker,
        timestamp: Date.now(),
      });

      return speaker;
    } catch (error: any) {
      console.error('SpeakerService Error:', error);
      throw new Error(error.message || 'Não foi possível carregar o perfil do palestrante');
    }
  }

  async getSpeakerSessions(speakerId: string): Promise<ISession[]> {
    // Check cache first
    const cached = this.sessionsCache.get(speakerId);
    if (cached && this.isCacheValid(cached.timestamp, this.SESSIONS_CACHE_DURATION)) {
      console.log(`📦 Cache hit for speaker sessions ${speakerId}`);
      return cached.sessions;
    }

    try {
      console.log(`🌐 Fetching sessions for speaker ${speakerId}`);
      const response = await apiService.get<SessionListResponse>(
        '/sessions',
        { speakerId }
      );

      if (!response.success) {
        throw new Error('Não foi possível carregar as sessões do palestrante');
      }

      const sessions: ISession[] = response.data.map(session => ({
        _id: session._id,
        title: session.title,
        description: session.description,
        type: session.type as any,
        startTime: new Date(session.startTime),
        endTime: new Date(session.endTime),
        stage: session.stage,
        speakerIds: session.speakerIds,
        tags: session.tags,
        isHighlight: session.isHighlight,
        isVisible: session.isVisible,
        technicalLevel: session.technicalLevel,
        language: session.language,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Cache the result
      this.sessionsCache.set(speakerId, {
        sessions,
        timestamp: Date.now(),
      });

      return sessions;
    } catch (error: any) {
      console.error('SpeakerService Sessions Error:', error);
      throw new Error(error.message || 'Não foi possível carregar as sessões do palestrante');
    }
  }

  clearCache(speakerId?: string): void {
    if (speakerId) {
      this.speakerCache.delete(speakerId);
      this.sessionsCache.delete(speakerId);
    } else {
      this.speakerCache.clear();
      this.sessionsCache.clear();
    }
  }
}

export default new SpeakerService();