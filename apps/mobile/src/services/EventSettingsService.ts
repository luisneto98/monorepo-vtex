import apiService from './api';
import { CacheService } from './CacheService';
import { EventSettings } from '@monorepo-vtex/shared/types/event-settings';

const CACHE_KEY = '@cache_event_settings';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface EventSettingsServiceError {
  message: string;
  code: 'NETWORK_ERROR' | 'NOT_FOUND' | 'SERVER_ERROR' | 'UNKNOWN_ERROR';
}

/**
 * Service for fetching and caching event settings
 * Implements stale-while-revalidate pattern with 24h TTL
 */
export class EventSettingsService {
  /**
   * Fetch event settings from API with cache support
   * Uses stale-while-revalidate pattern: returns cached data immediately,
   * then fetches fresh data in background
   */
  static async fetchEventSettings(
    useCache: boolean = true
  ): Promise<EventSettings> {
    try {
      // Check cache first if enabled
      if (useCache) {
        const cached = await CacheService.get<EventSettings>(CACHE_KEY);
        if (cached) {
          // Return cached data immediately
          // Optionally trigger background refresh (stale-while-revalidate)
          this.refreshInBackground();
          return cached;
        }
      }

      // Fetch fresh data from API (using public endpoint - no auth required)
      const response = await apiService.get<{ statusCode: number; message: string; data: EventSettings }>('/event-settings/public');

      // Extract data from API response wrapper
      const eventSettings = response.data;

      // Cache the response
      await CacheService.set(CACHE_KEY, eventSettings, CACHE_TTL);

      return eventSettings;
    } catch (error: any) {
      // If error occurs, try to return stale cached data as fallback
      const cached = await CacheService.get<EventSettings>(CACHE_KEY);
      if (cached) {
        console.warn('Using stale cache due to fetch error:', error);
        return cached;
      }

      // No cache available, throw transformed error
      throw this.transformError(error);
    }
  }

  /**
   * Refresh event settings in background without blocking
   * Used for stale-while-revalidate pattern
   */
  private static async refreshInBackground(): Promise<void> {
    try {
      const response = await apiService.get<{ statusCode: number; message: string; data: EventSettings }>('/event-settings/public');
      await CacheService.set(CACHE_KEY, response.data, CACHE_TTL);
    } catch (error) {
      // Silently fail background refresh
      console.debug('Background refresh failed:', error);
    }
  }

  /**
   * Force refresh event settings, bypassing cache
   * Used for pull-to-refresh functionality
   */
  static async refreshEventSettings(): Promise<EventSettings> {
    try {
      // Clear cache first
      await CacheService.invalidate(CACHE_KEY);

      // Fetch fresh data
      const response = await apiService.get<{ statusCode: number; message: string; data: EventSettings }>('/event-settings/public');

      // Extract data from response
      const eventSettings = response.data;

      // Update cache
      await CacheService.set(CACHE_KEY, eventSettings, CACHE_TTL);

      return eventSettings;
    } catch (error: any) {
      throw this.transformError(error);
    }
  }

  /**
   * Check if cached event settings are available and valid
   */
  static async hasCachedData(): Promise<boolean> {
    return await CacheService.isValid(CACHE_KEY);
  }

  /**
   * Clear cached event settings
   */
  static async clearCache(): Promise<void> {
    await CacheService.invalidate(CACHE_KEY);
  }

  /**
   * Transform API errors into structured error objects
   */
  private static transformError(error: any): EventSettingsServiceError {
    if (error.status === 404) {
      return {
        message: 'Event settings not found. Please contact support.',
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
   * Get localized event name based on device locale
   * Falls back to Portuguese if locale not supported
   */
  static getLocalizedEventName(
    eventSettings: EventSettings,
    locale: string = 'pt'
  ): string {
    // Extract language code from locale (e.g., 'en-US' -> 'en')
    const lang = locale.toLowerCase().split('-')[0];

    // Map to supported languages
    const supportedLangs = ['pt', 'en', 'es'];
    const selectedLang = supportedLangs.includes(lang) ? lang : 'pt';

    return eventSettings.eventName[selectedLang as 'pt' | 'en' | 'es'];
  }

  /**
   * Validate map coordinates are within valid ranges
   */
  static validateCoordinates(coords: { latitude: number; longitude: number }): boolean {
    const { latitude, longitude } = coords;
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  }
}
