import apiService from './api';
import { CacheService } from './CacheService';
import { PressMaterial, PressMaterialType } from '@monorepo-vtex/shared/types/press-materials';

const CACHE_KEY_PRESS_MATERIALS = '@cache_press_materials';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

export interface PressMaterialsServiceError {
  message: string;
  code: 'NETWORK_ERROR' | 'NOT_FOUND' | 'SERVER_ERROR' | 'UNKNOWN_ERROR';
}

/**
 * Service for fetching and caching press materials data
 * Implements stale-while-revalidate pattern with 10-minute TTL
 */
export class PressMaterialsService {
  /**
   * Fetch press materials with cache support
   * Uses stale-while-revalidate pattern: returns cached data immediately,
   * then fetches fresh data in background
   */
  static async fetchPublicPressMaterials(
    useCache: boolean = true
  ): Promise<PressMaterial[]> {
    try {
      // Check cache first if enabled
      if (useCache) {
        const cached = await CacheService.get<PressMaterial[]>(CACHE_KEY_PRESS_MATERIALS);
        if (cached) {
          // Return cached data immediately
          // Optionally trigger background refresh (stale-while-revalidate)
          this.refreshInBackground();
          return cached;
        }
      }

      // Fetch fresh data from API (using public endpoint - no auth required)
      const response = await apiService.get<{ data: PressMaterial[] }>('/press-materials/public');

      console.log('[PressMaterialsService] Full API response:', JSON.stringify(response, null, 2));
      console.log('[PressMaterialsService] response.data:', response.data);
      console.log('[PressMaterialsService] response.data.data:', response.data?.data);

      // Extract data from API response wrapper (NestJS ApiResponse.success format)
      // Handle different response structures: response.data.data or response.data
      let materialsData: PressMaterial[];
      if (Array.isArray(response.data)) {
        // Direct array in response.data
        materialsData = response.data;
      } else if (Array.isArray(response.data?.data)) {
        // Array in response.data.data (NestJS ApiResponse.success format)
        materialsData = response.data.data;
      } else {
        // Unexpected format
        console.error('[PressMaterialsService] Unexpected response format:', response.data);
        materialsData = [];
      }

      console.log('[PressMaterialsService] Extracted materials:', materialsData);
      console.log('[PressMaterialsService] Materials count:', materialsData?.length);

      // Cache the response
      await CacheService.set(CACHE_KEY_PRESS_MATERIALS, materialsData, CACHE_TTL);

      return materialsData;
    } catch (error: any) {
      // If error occurs, try to return stale cached data as fallback
      const cached = await CacheService.get<PressMaterial[]>(CACHE_KEY_PRESS_MATERIALS);
      if (cached) {
        console.warn('Using stale cache due to fetch error:', error);
        return cached;
      }

      // No cache available, throw transformed error
      throw this.transformError(error);
    }
  }

  /**
   * Refresh press materials data in background without blocking
   * Used for stale-while-revalidate pattern
   */
  private static async refreshInBackground(): Promise<void> {
    try {
      const response = await apiService.get<{ data: PressMaterial[] }>('/press-materials/public');
      await CacheService.set(CACHE_KEY_PRESS_MATERIALS, response.data.data, CACHE_TTL);
    } catch (error) {
      // Silently fail background refresh
      console.debug('Background refresh failed:', error);
    }
  }

  /**
   * Force refresh press materials data, bypassing cache
   * Used for pull-to-refresh functionality
   */
  static async refreshPressMaterials(): Promise<PressMaterial[]> {
    try {
      // Clear cache first
      await CacheService.invalidate(CACHE_KEY_PRESS_MATERIALS);

      // Fetch fresh data
      const response = await apiService.get<{ data: PressMaterial[] }>('/press-materials/public');

      // Extract data from response (NestJS ApiResponse.success format)
      const materialsData = response.data.data;

      // Update cache
      await CacheService.set(CACHE_KEY_PRESS_MATERIALS, materialsData, CACHE_TTL);

      return materialsData;
    } catch (error: any) {
      throw this.transformError(error);
    }
  }

  /**
   * Track download and get download URL
   * Calls the download tracking endpoint which increments downloadCount
   */
  static async trackDownload(id: string): Promise<string> {
    try {
      const response = await apiService.get<{ url: string }>(`/press-materials/${id}/download`);
      return response.data.url;
    } catch (error: any) {
      throw this.transformError(error);
    }
  }

  /**
   * Check if cached press materials data is available and valid
   */
  static async hasCachedData(): Promise<boolean> {
    return await CacheService.isValid(CACHE_KEY_PRESS_MATERIALS);
  }

  /**
   * Clear cached press materials data
   */
  static async clearCache(): Promise<void> {
    await CacheService.invalidate(CACHE_KEY_PRESS_MATERIALS);
  }

  /**
   * Transform API errors into structured error objects
   */
  private static transformError(error: any): PressMaterialsServiceError {
    if (error.status === 404) {
      return {
        message: 'Press materials not found. Please try again later.',
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
   * Get localized string based on device locale
   * Falls back to Portuguese if locale not supported
   * Supports pt-BR/pt → pt, en, es
   */
  static getLocalizedString(
    localizedString: { pt: string; en: string; es: string },
    locale: string = 'pt-BR'
  ): string {
    // Normalize locale to supported languages
    if (locale.startsWith('pt')) {
      return localizedString.pt;
    } else if (locale.startsWith('es')) {
      return localizedString.es;
    } else if (locale.startsWith('en')) {
      return localizedString.en;
    }
    // Fallback to Portuguese
    return localizedString.pt;
  }

  /**
   * Group press materials by type
   */
  static groupByType(materials: PressMaterial[]): Map<PressMaterialType, PressMaterial[]> {
    const grouped = new Map<PressMaterialType, PressMaterial[]>();

    // Guard against undefined/null materials array
    if (!materials || !Array.isArray(materials)) {
      return grouped;
    }

    materials.forEach(material => {
      const existing = grouped.get(material.type) || [];
      grouped.set(material.type, [...existing, material]);
    });

    return grouped;
  }

  /**
   * Filter materials by type
   */
  static filterByType(
    materials: PressMaterial[],
    type: PressMaterialType | 'all'
  ): PressMaterial[] {
    // Guard against undefined/null materials array
    if (!materials || !Array.isArray(materials)) {
      return [];
    }

    if (type === 'all') {
      return materials;
    }
    return materials.filter(material => material.type === type);
  }
}
