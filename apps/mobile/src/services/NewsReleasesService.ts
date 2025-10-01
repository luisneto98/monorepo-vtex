import apiService from './api';
import { CacheService } from './CacheService';
import { NewsRelease, NewsReleaseFilter } from '@vtexday26/shared/types/news-releases';

const CACHE_KEY_NEWS_FEED = '@cache_news_feed';
const CACHE_KEY_NEWS_ARTICLE = '@cache_news_article_';
const CACHE_KEY_FEATURED = '@cache_news_featured';
const CACHE_TTL_FEED = 5 * 60 * 1000; // 5 minutes for feed
const CACHE_TTL_ARTICLE = -1; // Permanent cache for viewed articles

export interface NewsReleasesServiceError {
  message: string;
  code: 'NETWORK_ERROR' | 'NOT_FOUND' | 'SERVER_ERROR' | 'UNKNOWN_ERROR';
}

export interface NewsReleasePaginatedResponse {
  data: NewsRelease[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Service for fetching and caching news releases data
 * Implements different caching strategies:
 * - Feed: 5-minute TTL with stale-while-revalidate
 * - Articles: Permanent cache for offline reading
 */
export class NewsReleasesService {
  /**
   * Fetch paginated news releases with filters
   * Uses stale-while-revalidate pattern for feed
   */
  static async getPublicNews(
    filters: NewsReleaseFilter = {},
    useCache: boolean = true
  ): Promise<NewsReleasePaginatedResponse> {
    try {
      const cacheKey = this.buildCacheKey(CACHE_KEY_NEWS_FEED, filters);

      // Check cache first if enabled
      if (useCache) {
        const cached = await CacheService.get<NewsReleasePaginatedResponse>(cacheKey);
        if (cached) {
          // Return cached data immediately
          // Trigger background refresh (stale-while-revalidate)
          this.refreshFeedInBackground(filters, cacheKey);
          return cached;
        }
      }

      // Fetch fresh data from API
      const response = await apiService.get<any>(
        '/public/news',
        { params: this.buildQueryParams(filters) }
      );

      console.log('🔍 RAW API Response:', JSON.stringify(response, null, 2));

      // Extract data from response - API returns nested structure
      // Format: { statusCode, message, data: { items, total, page, pages }, timestamp }
      let newsData: NewsReleasePaginatedResponse;

      console.log('📰 API Response structure:', {
        hasData: !!response.data,
        hasDataData: !!(response.data && response.data.data),
        hasDataDataItems: !!(response.data && response.data.data && response.data.data.items),
        itemsCount: response.data?.data?.items?.length || 0,
        fullDataKeys: response.data ? Object.keys(response.data) : [],
      });

      if (response.data && response.data.data && response.data.data.items) {
        // Correct API format with nested data.data.items
        newsData = {
          data: response.data.data.items,
          pagination: {
            total: response.data.data.total || 0,
            page: response.data.data.page || 1,
            limit: filters.limit || 10,
            pages: response.data.data.pages || 1,
          },
        };
        console.log('✅ Mapped news data:', {
          articlesCount: newsData.data.length,
          pagination: newsData.pagination,
        });
      } else if (response.data && response.data.items) {
        // Alternative format with data.items directly
        newsData = {
          data: response.data.items,
          pagination: {
            total: response.data.total || 0,
            page: response.data.page || 1,
            limit: filters.limit || 10,
            pages: response.data.pages || 1,
          },
        };
      } else if (response.data && Array.isArray(response.data)) {
        // Array directly
        newsData = {
          data: response.data,
          pagination: {
            total: response.data.length,
            page: filters.page || 1,
            limit: filters.limit || 10,
            pages: 1,
          },
        };
      } else {
        // Fallback to empty response
        console.warn('Unexpected API response format:', response);
        newsData = {
          data: [],
          pagination: {
            total: 0,
            page: filters.page || 1,
            limit: filters.limit || 10,
            pages: 0,
          },
        };
      }

      // Cache the response
      await CacheService.set(cacheKey, newsData, CACHE_TTL_FEED);

      return newsData;
    } catch (error: any) {
      // If error occurs, try to return stale cached data as fallback
      const cacheKey = this.buildCacheKey(CACHE_KEY_NEWS_FEED, filters);
      const cached = await CacheService.get<NewsReleasePaginatedResponse>(cacheKey);
      if (cached) {
        console.warn('Using stale cache due to fetch error:', error);
        return cached;
      }

      // No cache available, throw transformed error
      throw this.transformError(error);
    }
  }

  /**
   * Fetch featured news releases
   */
  static async getFeaturedNews(useCache: boolean = true): Promise<NewsRelease[]> {
    try {
      // Check cache first if enabled
      if (useCache) {
        const cached = await CacheService.get<NewsRelease[]>(CACHE_KEY_FEATURED);
        if (cached) {
          // Trigger background refresh
          this.refreshFeaturedInBackground();
          return cached;
        }
      }

      // Fetch fresh data from API
      const response = await apiService.get<any>('/public/news/featured');

      // Extract data from response - handle API format
      let featuredData: NewsRelease[];

      if (response.data && response.data.data && response.data.data.items) {
        // Format: { data: { items: [...] } }
        featuredData = response.data.data.items;
      } else if (response.data && response.data.items) {
        // Format: { data: { items: [...] } } (one level less)
        featuredData = response.data.items;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Format: { data: { data: [...] } }
        featuredData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        // Format: { data: [...] }
        featuredData = response.data;
      } else {
        featuredData = [];
      }

      // Cache the response
      await CacheService.set(CACHE_KEY_FEATURED, featuredData, CACHE_TTL_FEED);

      return featuredData;
    } catch (error: any) {
      // If error occurs, try to return stale cached data as fallback
      const cached = await CacheService.get<NewsRelease[]>(CACHE_KEY_FEATURED);
      if (cached) {
        console.warn('Using stale cache due to fetch error:', error);
        return cached;
      }

      // No cache available, throw transformed error
      throw this.transformError(error);
    }
  }

  /**
   * Fetch single news release by slug
   * Caches permanently for offline reading
   */
  static async getNewsBySlug(slug: string, useCache: boolean = true): Promise<NewsRelease> {
    try {
      const cacheKey = `${CACHE_KEY_NEWS_ARTICLE}${slug}`;

      // Check cache first if enabled
      if (useCache) {
        const cached = await CacheService.get<NewsRelease>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Fetch fresh data from API
      const response = await apiService.get<any>(`/public/news/${slug}`);

      // Extract data from response - handle API format
      let articleData: NewsRelease;

      if (response.data && response.data.data) {
        // Format: { data: { data: {...} } } or { data: {...} }
        articleData = typeof response.data.data === 'object' && !Array.isArray(response.data.data)
          ? response.data.data
          : response.data;
      } else if (response.data) {
        // Format: { data: {...} }
        articleData = response.data;
      } else {
        throw new Error('Invalid article data received from API');
      }

      // Cache permanently for offline reading
      await CacheService.set(cacheKey, articleData, CACHE_TTL_ARTICLE);

      return articleData;
    } catch (error: any) {
      // If error occurs, try to return cached data as fallback
      const cacheKey = `${CACHE_KEY_NEWS_ARTICLE}${slug}`;
      const cached = await CacheService.get<NewsRelease>(cacheKey);
      if (cached) {
        console.warn('Using cached article due to fetch error:', error);
        return cached;
      }

      // No cache available, throw transformed error
      throw this.transformError(error);
    }
  }

  /**
   * Increment view count for an article
   * Note: Backend automatically increments view count when fetching by slug
   * This method is for explicit tracking if needed
   */
  static async incrementViewCount(slug: string): Promise<void> {
    try {
      // Backend endpoint automatically increments view count on GET
      // This is a no-op placeholder for explicit tracking if needed
      await apiService.get(`/public/news/${slug}`);
    } catch (error) {
      // Silently fail view count tracking
      console.debug('View count tracking failed:', error);
    }
  }

  /**
   * Force refresh news feed, bypassing cache
   * Used for pull-to-refresh functionality
   */
  static async refreshNews(filters: NewsReleaseFilter = {}): Promise<NewsReleasePaginatedResponse> {
    try {
      const cacheKey = this.buildCacheKey(CACHE_KEY_NEWS_FEED, filters);

      // Clear cache first
      await CacheService.invalidate(cacheKey);

      // Fetch fresh data
      const response = await apiService.get<any>(
        '/public/news',
        { params: this.buildQueryParams(filters) }
      );

      // Handle different response formats (same logic as getPublicNews)
      let newsData: NewsReleasePaginatedResponse;

      if (response.data && response.data.data && response.data.data.items) {
        newsData = {
          data: response.data.data.items,
          pagination: {
            total: response.data.data.total || 0,
            page: response.data.data.page || 1,
            limit: filters.limit || 10,
            pages: response.data.data.pages || 1,
          },
        };
      } else if (response.data && response.data.items) {
        newsData = {
          data: response.data.items,
          pagination: {
            total: response.data.total || 0,
            page: response.data.page || 1,
            limit: filters.limit || 10,
            pages: response.data.pages || 1,
          },
        };
      } else if (response.data && Array.isArray(response.data)) {
        newsData = {
          data: response.data,
          pagination: {
            total: response.data.length,
            page: filters.page || 1,
            limit: filters.limit || 10,
            pages: 1,
          },
        };
      } else {
        newsData = {
          data: [],
          pagination: {
            total: 0,
            page: filters.page || 1,
            limit: filters.limit || 10,
            pages: 0,
          },
        };
      }

      // Update cache
      await CacheService.set(cacheKey, newsData, CACHE_TTL_FEED);

      return newsData;
    } catch (error: any) {
      throw this.transformError(error);
    }
  }

  /**
   * Refresh feed in background without blocking
   */
  private static async refreshFeedInBackground(
    filters: NewsReleaseFilter,
    cacheKey: string
  ): Promise<void> {
    try {
      const response = await apiService.get<NewsReleasePaginatedResponse>(
        '/public/news',
        { params: this.buildQueryParams(filters) }
      );
      await CacheService.set(cacheKey, response.data, CACHE_TTL_FEED);
    } catch (error) {
      // Silently fail background refresh
      console.debug('Background refresh failed:', error);
    }
  }

  /**
   * Refresh featured articles in background
   */
  private static async refreshFeaturedInBackground(): Promise<void> {
    try {
      const response = await apiService.get<{ data: NewsRelease[] }>('/public/news/featured');
      const featuredData = Array.isArray(response.data) ? response.data : response.data.data;
      await CacheService.set(CACHE_KEY_FEATURED, featuredData, CACHE_TTL_FEED);
    } catch (error) {
      // Silently fail background refresh
      console.debug('Background featured refresh failed:', error);
    }
  }

  /**
   * Build cache key with filters for unique caching
   */
  private static buildCacheKey(baseKey: string, filters: NewsReleaseFilter): string {
    const filterString = JSON.stringify(filters);
    return `${baseKey}_${filterString}`;
  }

  /**
   * Build query params from filters
   */
  private static buildQueryParams(filters: NewsReleaseFilter): Record<string, any> {
    const params: Record<string, any> = {};

    if (filters.page !== undefined) params.page = filters.page;
    if (filters.limit !== undefined) params.limit = filters.limit;
    if (filters.language) params.language = filters.language;
    if (filters.categories && filters.categories.length > 0) {
      params.category = filters.categories[0]; // Single category for now
    }
    if (filters.tags && filters.tags.length > 0) {
      params.tag = filters.tags[0]; // Single tag for now
    }
    if (filters.search) params.search = filters.search;

    return params;
  }

  /**
   * Get localized content based on device locale
   * Falls back to Portuguese if locale not supported
   */
  static getLocalizedContent(
    newsRelease: NewsRelease,
    locale: string = 'pt-BR'
  ): { title: string; subtitle?: string; content: string } {
    // Normalize locale to supported languages
    let lang: 'pt-BR' | 'en' | 'es' = 'pt-BR';

    if (locale.startsWith('pt')) {
      lang = 'pt-BR';
    } else if (locale.startsWith('es')) {
      lang = 'es';
    } else if (locale.startsWith('en')) {
      lang = 'en';
    }

    return newsRelease.content[lang];
  }

  /**
   * Transform API errors into structured error objects
   */
  private static transformError(error: any): NewsReleasesServiceError {
    if (error.status === 404) {
      return {
        message: 'Article not found. Please try again later.',
        code: 'NOT_FOUND',
      };
    }

    if (error.status >= 500) {
      return {
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
      };
    }

    if (error.name === 'AbortError' || error.message?.includes('Network request failed')) {
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }

    return {
      message: error.message || 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
    };
  }

  /**
   * Clear all news-related caches
   */
  static async clearCache(): Promise<void> {
    await CacheService.invalidate(CACHE_KEY_NEWS_FEED);
    await CacheService.invalidate(CACHE_KEY_FEATURED);
    // Note: Article caches are permanent and not cleared
  }
}
