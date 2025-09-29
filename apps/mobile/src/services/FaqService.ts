import apiService, { PaginatedResponse } from './api';
import type { Faq, FaqCategory } from '@vtexday26/shared';

interface FaqFilters {
  search?: string;
  category?: string;
  lang?: 'pt-BR' | 'en';
  isVisible?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

class FaqService {
  private readonly cacheKey = 'faq_cache';
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minutes
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  private getCacheKey(params: FaqFilters): string {
    return `${this.cacheKey}_${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  async getFAQs(filters: FaqFilters = {}): Promise<PaginatedResponse<Faq>> {
    const cacheKey = this.getCacheKey(filters);
    const cached = this.getFromCache<PaginatedResponse<Faq>>(cacheKey);

    if (cached) {
      return cached;
    }

    const params: Record<string, any> = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      isVisible: filters.isVisible !== undefined ? filters.isVisible : true,
    };

    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.lang) params.lang = filters.lang;
    if (filters.sort) params.sort = filters.sort;

    const result = await apiService.getPaginated<Faq>('/faq', params.page, params.limit, params);
    this.setCache(cacheKey, result);

    return result;
  }

  async getPopularFAQs(limit: number = 5, lang?: 'pt-BR' | 'en'): Promise<PaginatedResponse<Faq>> {
    const params: Record<string, any> = {
      page: 1,
      limit,
    };

    if (lang) params.lang = lang;

    return apiService.getPaginated<Faq>('/faq/popular', params.page, params.limit, params);
  }

  async getFAQCategories(): Promise<PaginatedResponse<FaqCategory>> {
    const cacheKey = `${this.cacheKey}_categories`;
    const cached = this.getFromCache<PaginatedResponse<FaqCategory>>(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await apiService.getPaginated<FaqCategory>('/faq/categories', 1, 100);
    this.setCache(cacheKey, result);

    return result;
  }

  async incrementViewCount(faqId: string): Promise<void> {
    try {
      await apiService.post(`/faq/${faqId}/view`, {});
    } catch (error) {
      console.error('Failed to increment FAQ view count:', error);
      // Don't throw - view count tracking should not break user experience
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default new FaqService();