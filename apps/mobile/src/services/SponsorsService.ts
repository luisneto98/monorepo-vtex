import apiService from './api';
import { CacheService } from './CacheService';
import { Sponsor } from '@monorepo-vtex/shared/types/sponsor.types';

const CACHE_KEY_SPONSORS = '@cache_sponsors_by_tier';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface TierGroupedSponsors {
  tier: {
    _id: string;
    name: string;
    displayName: {
      'pt-BR': string;
      en: string;
    };
    order: number;
  };
  sponsors: Sponsor[];
}

export interface SponsorsServiceError {
  message: string;
  code: 'NETWORK_ERROR' | 'NOT_FOUND' | 'SERVER_ERROR' | 'UNKNOWN_ERROR';
}

/**
 * Service for fetching and caching sponsors data
 * Implements stale-while-revalidate pattern with 24h TTL
 */
export class SponsorsService {
  /**
   * Fetch sponsors grouped by tier with cache support
   * Uses stale-while-revalidate pattern: returns cached data immediately,
   * then fetches fresh data in background
   */
  static async fetchSponsorsByTier(
    useCache: boolean = true
  ): Promise<TierGroupedSponsors[]> {
    try {
      // Check cache first if enabled
      if (useCache) {
        const cached = await CacheService.get<TierGroupedSponsors[]>(CACHE_KEY_SPONSORS);
        if (cached) {
          // Return cached data immediately
          // Optionally trigger background refresh (stale-while-revalidate)
          this.refreshInBackground();
          return cached;
        }
      }

      // Fetch fresh data from API (using public endpoint - no auth required)
      const response = await apiService.get<{ data: TierGroupedSponsors[] }>('/sponsors/public/grouped-by-tier');

      // Extract data from API response wrapper (NestJS ApiResponse.success format)
      const sponsorsData = response.data.data;

      // Cache the response
      await CacheService.set(CACHE_KEY_SPONSORS, sponsorsData, CACHE_TTL);

      return sponsorsData;
    } catch (error: any) {
      // If error occurs, try to return stale cached data as fallback
      const cached = await CacheService.get<TierGroupedSponsors[]>(CACHE_KEY_SPONSORS);
      if (cached) {
        console.warn('Using stale cache due to fetch error:', error);
        return cached;
      }

      // No cache available, throw transformed error
      throw this.transformError(error);
    }
  }

  /**
   * Refresh sponsors data in background without blocking
   * Used for stale-while-revalidate pattern
   */
  private static async refreshInBackground(): Promise<void> {
    try {
      const response = await apiService.get<{ data: TierGroupedSponsors[] }>('/sponsors/public/grouped-by-tier');
      await CacheService.set(CACHE_KEY_SPONSORS, response.data.data, CACHE_TTL);
    } catch (error) {
      // Silently fail background refresh
      console.debug('Background refresh failed:', error);
    }
  }

  /**
   * Force refresh sponsors data, bypassing cache
   * Used for pull-to-refresh functionality
   */
  static async refreshSponsors(): Promise<TierGroupedSponsors[]> {
    try {
      // Clear cache first
      await CacheService.invalidate(CACHE_KEY_SPONSORS);

      // Fetch fresh data
      const response = await apiService.get<{ data: TierGroupedSponsors[] }>('/sponsors/public/grouped-by-tier');

      // Extract data from response (NestJS ApiResponse.success format)
      const sponsorsData = response.data.data;

      // Update cache
      await CacheService.set(CACHE_KEY_SPONSORS, sponsorsData, CACHE_TTL);

      return sponsorsData;
    } catch (error: any) {
      throw this.transformError(error);
    }
  }

  /**
   * Fetch single sponsor by ID from public endpoint (no caching for individual sponsors)
   */
  static async fetchSponsorById(id: string): Promise<Sponsor> {
    try {
      const response = await apiService.get<{ data: Sponsor }>(`/sponsors/public/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw this.transformError(error);
    }
  }

  /**
   * Check if cached sponsors data is available and valid
   */
  static async hasCachedData(): Promise<boolean> {
    return await CacheService.isValid(CACHE_KEY_SPONSORS);
  }

  /**
   * Clear cached sponsors data
   */
  static async clearCache(): Promise<void> {
    await CacheService.invalidate(CACHE_KEY_SPONSORS);
  }

  /**
   * Transform API errors into structured error objects
   */
  private static transformError(error: any): SponsorsServiceError {
    if (error.status === 404) {
      return {
        message: 'Sponsors not found. Please try again later.',
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
   * Get localized sponsor description based on device locale
   * Falls back to Portuguese if locale not supported
   */
  static getLocalizedDescription(
    sponsor: Sponsor,
    locale: string = 'pt-BR'
  ): string {
    // Check if locale is pt-BR or en
    const lang = locale.startsWith('pt') ? 'pt-BR' : 'en';
    return sponsor.description[lang] || sponsor.description['pt-BR'];
  }

  /**
   * Get localized tier name based on device locale
   * Falls back to Portuguese if locale not supported
   */
  static getLocalizedTierName(
    tierDisplayName: { 'pt-BR': string; en: string },
    locale: string = 'pt-BR'
  ): string {
    const lang = locale.startsWith('pt') ? 'pt-BR' : 'en';
    return tierDisplayName[lang] || tierDisplayName['pt-BR'];
  }
}
