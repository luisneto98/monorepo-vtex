import { ISession, Speaker, Sponsor } from '@monorepo-vtex/shared';
import apiService from './api';

interface SessionDetailsResponse {
  success: boolean;
  data: {
    _id: string;
    title: { 'pt-BR': string; en: string };
    description: { 'pt-BR': string; en: string };
    type?: string;
    startTime: string;
    endTime: string;
    stage: string;
    speakerIds: {
      _id: string;
      name: string;
      photoUrl: string;
      company: string;
      bio: { 'pt-BR': string; en: string };
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
    }[];
    sponsorIds?: {
      _id: string;
      name: string;
      logoUrl: string;
      tier: string;
      description: { 'pt-BR': string; en: string };
      website: string;
    }[];
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
  };
}

interface CachedSessionDetails {
  session: ISession;
  speakers: Speaker[];
  sponsors: Sponsor[];
  timestamp: number;
}

class SessionDetailsService {
  private cache: Map<string, CachedSessionDetails> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  async getSessionById(sessionId: string): Promise<{
    session: ISession;
    speakers: Speaker[];
    sponsors: Sponsor[];
  }> {
    // Check cache first
    const cached = this.cache.get(sessionId);
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log(`📦 Cache hit for session ${sessionId}`);
      return {
        session: cached.session,
        speakers: cached.speakers,
        sponsors: cached.sponsors,
      };
    }

    try {
      console.log(`🌐 Fetching session details for ${sessionId}`);
      const response = await apiService.get<any>(
        `/sessions/${sessionId}`
      );

      console.log('📦 API Response:', JSON.stringify(response, null, 2));

      // Handle nested NestJS response structure: { statusCode, data: { success, data: {...} } }
      const innerData = response.data || response;

      if (!innerData || !innerData.success || !innerData.data) {
        console.error('❌ Invalid response:', response);
        throw new Error('Sessão não encontrada');
      }

      const rawData = innerData.data;

      // Transform the response data
      const session: ISession = {
        _id: rawData._id,
        title: rawData.title,
        description: rawData.description,
        type: rawData.type as any,
        startTime: new Date(rawData.startTime),
        endTime: new Date(rawData.endTime),
        stage: rawData.stage,
        speakerIds: rawData.speakerIds.map(s => s._id),
        sponsorIds: rawData.sponsorIds?.map(s => s._id),
        tags: rawData.tags,
        capacity: rawData.capacity,
        registeredCount: rawData.registeredCount,
        isHighlight: rawData.isHighlight,
        isVisible: rawData.isVisible,
        technicalLevel: rawData.technicalLevel,
        language: rawData.language,
        streamUrl: rawData.streamUrl,
        materials: rawData.materials,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const speakers: Speaker[] = rawData.speakerIds.map(s => ({
        _id: s._id,
        name: s.name,
        photoUrl: s.photoUrl,
        company: s.company,
        bio: s.bio,
        position: s.position,
        socialLinks: s.socialLinks,
        priority: s.priority,
        isHighlight: s.isHighlight,
        isVisible: s.isVisible,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const sponsors: Sponsor[] = rawData.sponsorIds?.map(s => ({
        _id: s._id,
        name: s.name,
        logoUrl: s.logoUrl,
        tier: s.tier as any,
        description: s.description,
        website: s.website,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) || [];

      // Cache the result
      this.cache.set(sessionId, {
        session,
        speakers,
        sponsors,
        timestamp: Date.now(),
      });

      return { session, speakers, sponsors };
    } catch (error: any) {
      console.error('SessionDetailsService Error:', error);
      throw new Error(error.message || 'Não foi possível carregar os detalhes da sessão');
    }
  }

  clearCache(sessionId?: string): void {
    if (sessionId) {
      this.cache.delete(sessionId);
    } else {
      this.cache.clear();
    }
  }
}

export default new SessionDetailsService();