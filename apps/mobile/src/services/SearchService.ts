import apiService, { PaginatedResponse } from './api';
import FaqService from './FaqService';
import type { Faq } from '@vtexday26/shared';
import type { Session, Speaker } from '@vtexday26/shared';

export type SearchContext = 'faq' | 'sessions' | 'speakers';

interface SearchResult<T> {
  type: SearchContext;
  data: PaginatedResponse<T>;
}

class SearchService {
  async searchFAQs(query: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<Faq>> {
    return FaqService.getFAQs({
      search: query,
      page,
      limit,
      isVisible: true,
    });
  }

  async searchSessions(query: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<Session>> {
    return apiService.getPaginated<Session>('/sessions', page, limit, {
      search: query,
    });
  }

  async searchSpeakers(query: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<Speaker>> {
    return apiService.getPaginated<Speaker>('/speakers', page, limit, {
      search: query,
    });
  }

  async searchByContext(
    context: SearchContext,
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResult<any>> {
    switch (context) {
      case 'faq':
        return {
          type: 'faq',
          data: await this.searchFAQs(query, page, limit),
        };
      case 'sessions':
        return {
          type: 'sessions',
          data: await this.searchSessions(query, page, limit),
        };
      case 'speakers':
        return {
          type: 'speakers',
          data: await this.searchSpeakers(query, page, limit),
        };
      default:
        throw new Error(`Unknown search context: ${context}`);
    }
  }
}

export default new SearchService();