import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get byte length of a string (cross-platform compatible)
 * Works in both React Native and Web environments
 */
function getByteLength(str: string): number {
  // Use Blob API for web, otherwise use manual calculation
  if (typeof Blob !== 'undefined') {
    return new Blob([str]).size;
  }

  // Fallback for environments without Blob
  let byteLength = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      byteLength += 1;
    } else if (code < 0x800) {
      byteLength += 2;
    } else if (code < 0x10000) {
      byteLength += 3;
    } else {
      byteLength += 4;
    }
  }
  return byteLength;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheConfig {
  key: string;
  ttl: number; // milliseconds
}

// Cache configuration for different data types
export const CACHE_CONFIGS = {
  SESSIONS: { key: '@cache_sessions', ttl: 60 * 60 * 1000 }, // 1 hour
  SPEAKERS: { key: '@cache_speakers', ttl: 2 * 60 * 60 * 1000 }, // 2 hours
  FAQ: { key: '@cache_faq', ttl: 6 * 60 * 60 * 1000 }, // 6 hours
  SPONSORS: { key: '@cache_sponsors', ttl: 6 * 60 * 60 * 1000 }, // 6 hours
  EVENT_SETTINGS: { key: '@cache_event_settings', ttl: 24 * 60 * 60 * 1000 }, // 24 hours
} as const;

const MAX_CACHE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Service for managing offline data caching with TTL
 */
export class CacheService {
  /**
   * Set data in cache with TTL
   */
  static async set<T>(key: string, data: T, ttl: number): Promise<boolean> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      const serialized = JSON.stringify(entry);

      // Check cache size before storing
      const sizeOk = await this.checkCacheSize(key, serialized.length);
      if (!sizeOk) {
        console.warn('Cache size limit reached, evicting old entries');
        await this.evictOldEntries();
      }

      await AsyncStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Error setting cache for ${key}:`, error);
      return false;
    }
  }

  /**
   * Get data from cache if valid (not expired)
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);

      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Check if expired
      if (this.isExpired(entry)) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error(`Error getting cache for ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if cache entry is valid (exists and not expired)
   */
  static async isValid(key: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(key);

      if (!cached) {
        return false;
      }

      const entry: CacheEntry<any> = JSON.parse(cached);
      return !this.isExpired(entry);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if cache entry is expired
   */
  private static isExpired<T>(entry: CacheEntry<T>): boolean {
    const age = Date.now() - entry.timestamp;
    return age > entry.ttl;
  }

  /**
   * Invalidate specific cache key
   */
  static async invalidate(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error invalidating cache for ${key}:`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  static async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith('@cache_'));

      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  /**
   * Get total cache size in bytes
   */
  static async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith('@cache_'));

      if (cacheKeys.length === 0) {
        return 0;
      }

      const entries = await AsyncStorage.multiGet(cacheKeys);
      let totalSize = 0;

      for (const [key, value] of entries) {
        if (value) {
          // Use cross-platform byte length calculation
          totalSize += getByteLength(value);
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  /**
   * Check if adding new data would exceed cache size limit
   */
  private static async checkCacheSize(newKey: string, newDataSize: number): Promise<boolean> {
    try {
      const currentSize = await this.getCacheSize();

      // Check if existing key - if so, it will be replaced
      const existingData = await AsyncStorage.getItem(newKey);
      const existingSize = existingData ? getByteLength(existingData) : 0;

      const projectedSize = currentSize - existingSize + newDataSize;

      return projectedSize <= MAX_CACHE_SIZE_BYTES;
    } catch (error) {
      console.error('Error checking cache size:', error);
      return true; // Allow on error
    }
  }

  /**
   * Evict old cache entries using LRU strategy
   */
  private static async evictOldEntries(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith('@cache_'));

      if (cacheKeys.length === 0) {
        return;
      }

      const entries = await AsyncStorage.multiGet(cacheKeys);
      const entriesWithAge: Array<{ key: string; timestamp: number }> = [];

      for (const [key, value] of entries) {
        if (value) {
          try {
            const entry: CacheEntry<any> = JSON.parse(value);
            entriesWithAge.push({ key, timestamp: entry.timestamp });
          } catch (e) {
            // Invalid entry, will be removed
            await AsyncStorage.removeItem(key);
          }
        }
      }

      // Sort by timestamp (oldest first)
      entriesWithAge.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 25% of entries
      const toRemove = Math.ceil(entriesWithAge.length * 0.25);
      const keysToRemove = entriesWithAge.slice(0, toRemove).map((e) => e.key);

      await AsyncStorage.multiRemove(keysToRemove);
    } catch (error) {
      console.error('Error evicting old cache entries:', error);
    }
  }

  /**
   * Warm up cache with critical data
   */
  static async warmCache(dataLoaders: Record<string, () => Promise<any>>): Promise<void> {
    try {
      const promises = Object.entries(dataLoaders).map(async ([key, loader]) => {
        const cached = await this.get(key);
        if (!cached) {
          const data = await loader();
          const config = this.getCacheConfigForKey(key);
          if (config) {
            await this.set(key, data, config.ttl);
          }
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error warming cache:', error);
    }
  }

  /**
   * Get cache config for a given key
   */
  private static getCacheConfigForKey(key: string): CacheConfig | null {
    const config = Object.values(CACHE_CONFIGS).find((c) => c.key === key);
    return config || null;
  }

  /**
   * Get cache metadata (for debugging)
   */
  static async getCacheMetadata(): Promise<
    Array<{ key: string; size: number; age: number; ttl: number; expired: boolean }>
  > {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith('@cache_'));

      if (cacheKeys.length === 0) {
        return [];
      }

      const entries = await AsyncStorage.multiGet(cacheKeys);
      const metadata = [];

      for (const [key, value] of entries) {
        if (value) {
          try {
            const entry: CacheEntry<any> = JSON.parse(value);
            const age = Date.now() - entry.timestamp;
            const size = Buffer.byteLength(value, 'utf8');

            metadata.push({
              key,
              size,
              age,
              ttl: entry.ttl,
              expired: age > entry.ttl,
            });
          } catch (e) {
            // Skip invalid entries
          }
        }
      }

      return metadata;
    } catch (error) {
      console.error('Error getting cache metadata:', error);
      return [];
    }
  }
}