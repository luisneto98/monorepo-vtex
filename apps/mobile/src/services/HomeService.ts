import apiService, { PaginatedResponse } from './api';
import { ISession } from '../../../../packages/shared/src/types/session.types';
import { Speaker } from '../../../../packages/shared/src/types/speaker.types';

export interface HomeData {
  highlightSessions: ISession[];
  highlightSpeakers: Speaker[];
  upcomingSessions: ISession[];
}

class HomeService {
  private static readonly TIMEOUT_MS = 10000; // 10 seconds timeout

  async fetchHomeData(): Promise<HomeData> {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), HomeService.TIMEOUT_MS)
      );

      const dataPromise = Promise.all([
        this.getHighlightSessions(),
        this.getHighlightSpeakers(),
        this.getUpcomingSessions(),
      ]);

      const results = await Promise.race([dataPromise, timeoutPromise]) as any[];
      const [highlightSessionsRes, highlightSpeakersRes, upcomingSessionsRes] = results;

      // The API returns wrapped responses: { statusCode, message, data: { success, data, metadata } }
      // We need to extract the inner data
      return {
        highlightSessions: highlightSessionsRes.data?.data || highlightSessionsRes.data || [],
        highlightSpeakers: highlightSpeakersRes.data?.data || highlightSpeakersRes.data || [],
        upcomingSessions: upcomingSessionsRes.data?.data || upcomingSessionsRes.data || [],
      };
    } catch (error) {
      console.error('Error fetching home data:', error);
      throw error;
    }
  }

  async getHighlightSessions(): Promise<PaginatedResponse<ISession>> {
    return apiService.getPaginated<ISession>('/sessions', 1, 3, {
      isHighlight: true,
      isVisible: true,
      sort: 'startTime',
    });
  }

  async getHighlightSpeakers(): Promise<PaginatedResponse<Speaker>> {
    return apiService.getPaginated<Speaker>('/speakers', 1, 4, {
      isHighlight: true,
      isVisible: true,
      sort: 'priority',
    });
  }

  async getUpcomingSessions(): Promise<PaginatedResponse<ISession>> {
    return apiService.getPaginated<ISession>('/sessions', 1, 5, {
      isUpcoming: true,
      isVisible: true,
      sort: 'startTime',
    });
  }

  async refreshHomeData(): Promise<HomeData> {
    // Clear any potential cache if implemented
    return this.fetchHomeData();
  }
}

export default new HomeService();