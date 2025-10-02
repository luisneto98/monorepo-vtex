import apiService from './api';
import { CacheService } from './CacheService';
import { PublicLegalPage, SupportedLanguage } from '@shared/types/legal-pages';

const CACHE_KEY_LEGAL_PAGES = '@cache_legal_pages';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

export interface SignedUrlResponse {
  url: string;
  expiresIn: number;
}

export interface LegalPagesServiceError {
  message: string;
  code: 'NETWORK_ERROR' | 'NOT_FOUND' | 'SERVER_ERROR' | 'UNKNOWN_ERROR';
}

/**
 * Service for fetching and caching legal pages data
 * Implements stale-while-revalidate pattern with 15-minute TTL
 */
export class LegalPagesService {
  /**
   * Fetch public legal pages with cache support
   * Uses stale-while-revalidate pattern: returns cached data immediately,
   * then fetches fresh data in background
   */
  static async fetchPublicLegalPages(
    useCache: boolean = true
  ): Promise<PublicLegalPage[]> {
    try {
      // Check cache first if enabled
      if (useCache) {
        const cached = await CacheService.get<PublicLegalPage[]>(CACHE_KEY_LEGAL_PAGES);
        if (cached) {
          // Return cached data immediately
          // Optionally trigger background refresh (stale-while-revalidate)
          this.refreshInBackground();
          return cached;
        }
      }

      // Fetch fresh data from API (using public endpoint - no auth required)
      const response = await apiService.get<{ data: PublicLegalPage[] }>('/legal-pages/public/list');

      // Extract data from API response wrapper (NestJS ApiResponse.success format)
      // Handle different response structures: response.data.data or response.data
      let pagesData: PublicLegalPage[];
      if (Array.isArray(response.data)) {
        // Direct array in response.data
        pagesData = response.data;
      } else if (Array.isArray(response.data?.data)) {
        // Array in response.data.data (NestJS ApiResponse.success format)
        pagesData = response.data.data;
      } else {
        // Unexpected format
        pagesData = [];
      }

      // Cache the response
      await CacheService.set(CACHE_KEY_LEGAL_PAGES, pagesData, CACHE_TTL);

      return pagesData;
    } catch (error: any) {
      // If error occurs, try to return stale cached data as fallback
      const cached = await CacheService.get<PublicLegalPage[]>(CACHE_KEY_LEGAL_PAGES);
      if (cached) {
        return cached;
      }

      // No cache available, throw transformed error
      throw this.transformError(error);
    }
  }

  /**
   * Refresh legal pages data in background without blocking
   * Used for stale-while-revalidate pattern
   */
  private static async refreshInBackground(): Promise<void> {
    try {
      const response = await apiService.get<{ data: PublicLegalPage[] }>('/legal-pages/public/list');

      let pagesData: PublicLegalPage[];
      if (Array.isArray(response.data)) {
        pagesData = response.data;
      } else if (Array.isArray(response.data?.data)) {
        pagesData = response.data.data;
      } else {
        return;
      }

      await CacheService.set(CACHE_KEY_LEGAL_PAGES, pagesData, CACHE_TTL);
    } catch (error) {
      // Silently fail background refresh
    }
  }

  /**
   * Force refresh legal pages data, bypassing cache
   * Used for pull-to-refresh functionality
   */
  static async refreshLegalPages(): Promise<PublicLegalPage[]> {
    try {
      // Clear cache first
      await CacheService.invalidate(CACHE_KEY_LEGAL_PAGES);

      // Fetch fresh data
      const response = await apiService.get<{ data: PublicLegalPage[] }>('/legal-pages/public/list');

      // Extract data from response (NestJS ApiResponse.success format)
      let pagesData: PublicLegalPage[];
      if (Array.isArray(response.data)) {
        pagesData = response.data;
      } else if (Array.isArray(response.data?.data)) {
        pagesData = response.data.data;
      } else {
        pagesData = [];
      }

      // Update cache
      await CacheService.set(CACHE_KEY_LEGAL_PAGES, pagesData, CACHE_TTL);

      return pagesData;
    } catch (error: any) {
      throw this.transformError(error);
    }
  }

  /**
   * Get signed download URL for a legal page PDF
   * @param slug - Legal page slug
   * @param language - Preferred language code
   * @returns Signed URL with expiration time
   */
  static async getSignedDownloadUrl(slug: string, language: SupportedLanguage): Promise<SignedUrlResponse> {
    try {
      const response = await apiService.get<SignedUrlResponse>(
        `/legal-pages/public/${slug}/${language}/url`
      );

      // Handle response format
      if (response.data.url) {
        return response.data;
      } else if ((response.data as any).data?.url) {
        return (response.data as any).data;
      }

      // Missing URL in response
      const error = new Error('Invalid response format: missing URL');
      throw this.transformError(error);
    } catch (error: any) {
      throw this.transformError(error);
    }
  }

  /**
   * Check if cached legal pages data is available and valid
   */
  static async hasCachedData(): Promise<boolean> {
    return await CacheService.isValid(CACHE_KEY_LEGAL_PAGES);
  }

  /**
   * Clear cached legal pages data
   */
  static async clearCache(): Promise<void> {
    await CacheService.invalidate(CACHE_KEY_LEGAL_PAGES);
  }

  /**
   * Transform API errors into structured error objects
   */
  private static transformError(error: any): LegalPagesServiceError {
    if (error.status === 404) {
      return {
        message: 'Legal document not found. Please try again later.',
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
}
