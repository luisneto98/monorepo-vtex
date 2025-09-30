import AsyncStorage from '@react-native-async-storage/async-storage';
import { CacheService, CACHE_CONFIGS } from '../../../src/services/CacheService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('set', () => {
    it('should store data with TTL successfully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);

      const result = await CacheService.set('test_key', { foo: 'bar' }, 3600000);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'test_key',
        expect.stringContaining('"foo":"bar"')
      );
    });

    it('should return false on storage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await CacheService.set('test_key', { foo: 'bar' }, 3600000);

      expect(result).toBe(false);
    });

    it('should trigger eviction when cache size limit is reached', async () => {
      const largeData = 'x'.repeat(11 * 1024 * 1024); // 11MB
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(['@cache_old']);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
        ['@cache_old', JSON.stringify({ data: largeData, timestamp: Date.now(), ttl: 3600000 })],
      ]);
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await CacheService.set('@cache_new', { foo: 'bar' }, 3600000);

      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return data when cache is valid', async () => {
      const cacheEntry = {
        data: { foo: 'bar' },
        timestamp: Date.now(),
        ttl: 3600000,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheEntry));

      const result = await CacheService.get('test_key');

      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return null when cache does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await CacheService.get('test_key');

      expect(result).toBeNull();
    });

    it('should return null and remove entry when cache is expired', async () => {
      const cacheEntry = {
        data: { foo: 'bar' },
        timestamp: Date.now() - 7200000, // 2 hours ago
        ttl: 3600000, // 1 hour TTL
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheEntry));
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const result = await CacheService.get('test_key');

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test_key');
    });

    it('should return null on parsing error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

      const result = await CacheService.get('test_key');

      expect(result).toBeNull();
    });
  });

  describe('isValid', () => {
    it('should return true for valid non-expired cache', async () => {
      const cacheEntry = {
        data: { foo: 'bar' },
        timestamp: Date.now(),
        ttl: 3600000,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheEntry));

      const result = await CacheService.isValid('test_key');

      expect(result).toBe(true);
    });

    it('should return false for expired cache', async () => {
      const cacheEntry = {
        data: { foo: 'bar' },
        timestamp: Date.now() - 7200000,
        ttl: 3600000,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheEntry));

      const result = await CacheService.isValid('test_key');

      expect(result).toBe(false);
    });

    it('should return false when cache does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await CacheService.isValid('test_key');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await CacheService.isValid('test_key');

      expect(result).toBe(false);
    });
  });

  describe('invalidate', () => {
    it('should remove cache entry', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await CacheService.invalidate('test_key');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test_key');
    });

    it('should not throw on error', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(CacheService.invalidate('test_key')).resolves.not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('should remove only cache keys with @cache_ prefix', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        '@cache_sessions',
        '@cache_speakers',
        '@notifications_unread',
        '@user_preferences',
      ]);
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      await CacheService.clearAll();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@cache_sessions',
        '@cache_speakers',
      ]);
    });

    it('should handle empty cache gracefully', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);

      await expect(CacheService.clearAll()).resolves.not.toThrow();
    });
  });

  describe('getCacheSize', () => {
    it('should calculate total cache size correctly', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        '@cache_sessions',
        '@cache_speakers',
      ]);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
        ['@cache_sessions', JSON.stringify({ data: 'test1', timestamp: Date.now(), ttl: 3600000 })],
        ['@cache_speakers', JSON.stringify({ data: 'test2', timestamp: Date.now(), ttl: 3600000 })],
      ]);

      const size = await CacheService.getCacheSize();

      expect(size).toBeGreaterThan(0);
    });

    it('should return 0 when no cache exists', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);

      const size = await CacheService.getCacheSize();

      expect(size).toBe(0);
    });

    it('should return 0 on error', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const size = await CacheService.getCacheSize();

      expect(size).toBe(0);
    });
  });

  describe('evictOldEntries', () => {
    it('should remove oldest 25% of cache entries when triggered', async () => {
      const now = Date.now();
      const largeData = 'x'.repeat(3 * 1024 * 1024); // 3MB per entry

      // Mock to show large existing cache
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        '@cache_1',
        '@cache_2',
        '@cache_3',
        '@cache_4',
      ]);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
        ['@cache_1', JSON.stringify({ data: largeData, timestamp: now - 4000, ttl: 3600000 })],
        ['@cache_2', JSON.stringify({ data: largeData, timestamp: now - 3000, ttl: 3600000 })],
        ['@cache_3', JSON.stringify({ data: largeData, timestamp: now - 2000, ttl: 3600000 })],
        ['@cache_4', JSON.stringify({ data: largeData, timestamp: now - 1000, ttl: 3600000 })],
      ]);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null); // No existing key to replace
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      // This should trigger eviction since total size > 10MB
      await CacheService.set('@cache_new', { foo: 'bar' }, 3600000);

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['@cache_1']);
    });

    it('should handle empty cache gracefully', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);

      await expect(CacheService.set('@cache_test', { foo: 'bar' }, 3600000)).resolves.toBeDefined();
    });
  });

  describe('warmCache', () => {
    it('should load data for uncached keys', async () => {
      const mockLoader = jest.fn().mockResolvedValue({ foo: 'bar' });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await CacheService.warmCache({
        [CACHE_CONFIGS.SESSIONS.key]: mockLoader,
      });

      expect(mockLoader).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        CACHE_CONFIGS.SESSIONS.key,
        expect.stringContaining('"foo":"bar"')
      );
    });

    it('should skip loading for already cached keys', async () => {
      const mockLoader = jest.fn().mockResolvedValue({ foo: 'bar' });
      const cacheEntry = {
        data: { cached: 'data' },
        timestamp: Date.now(),
        ttl: 3600000,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheEntry));

      await CacheService.warmCache({
        [CACHE_CONFIGS.SESSIONS.key]: mockLoader,
      });

      expect(mockLoader).not.toHaveBeenCalled();
    });

    it('should handle loader failures gracefully', async () => {
      const mockLoader = jest.fn().mockRejectedValue(new Error('Load error'));
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await expect(
        CacheService.warmCache({
          [CACHE_CONFIGS.SESSIONS.key]: mockLoader,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('getCacheMetadata', () => {
    it('should return metadata for all cache entries', async () => {
      const now = Date.now();
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(['@cache_sessions', '@cache_speakers']);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
        ['@cache_sessions', JSON.stringify({ data: 'test1', timestamp: now - 1000, ttl: 3600000 })],
        ['@cache_speakers', JSON.stringify({ data: 'test2', timestamp: now - 2000, ttl: 7200000 })],
      ]);

      const metadata = await CacheService.getCacheMetadata();

      expect(metadata).toHaveLength(2);
      expect(metadata[0]).toMatchObject({
        key: '@cache_sessions',
        ttl: 3600000,
        expired: false,
      });
      expect(metadata[0].size).toBeGreaterThan(0);
      expect(metadata[0].age).toBeGreaterThanOrEqual(1000);
    });

    it('should return empty array when no cache exists', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);

      const metadata = await CacheService.getCacheMetadata();

      expect(metadata).toEqual([]);
    });

    it('should skip invalid cache entries', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(['@cache_valid', '@cache_invalid']);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
        ['@cache_valid', JSON.stringify({ data: 'test', timestamp: Date.now(), ttl: 3600000 })],
        ['@cache_invalid', 'invalid json'],
      ]);

      const metadata = await CacheService.getCacheMetadata();

      expect(metadata).toHaveLength(1);
      expect(metadata[0].key).toBe('@cache_valid');
    });

    it('should mark expired entries correctly', async () => {
      const now = Date.now();
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(['@cache_expired']);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
        ['@cache_expired', JSON.stringify({ data: 'test', timestamp: now - 7200000, ttl: 3600000 })],
      ]);

      const metadata = await CacheService.getCacheMetadata();

      expect(metadata[0].expired).toBe(true);
    });
  });

  describe('CACHE_CONFIGS', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_CONFIGS.SESSIONS.ttl).toBe(60 * 60 * 1000); // 1 hour
      expect(CACHE_CONFIGS.SPEAKERS.ttl).toBe(2 * 60 * 60 * 1000); // 2 hours
      expect(CACHE_CONFIGS.FAQ.ttl).toBe(6 * 60 * 60 * 1000); // 6 hours
      expect(CACHE_CONFIGS.SPONSORS.ttl).toBe(6 * 60 * 60 * 1000); // 6 hours
    });

    it('should have correct cache keys', () => {
      expect(CACHE_CONFIGS.SESSIONS.key).toBe('@cache_sessions');
      expect(CACHE_CONFIGS.SPEAKERS.key).toBe('@cache_speakers');
      expect(CACHE_CONFIGS.FAQ.key).toBe('@cache_faq');
      expect(CACHE_CONFIGS.SPONSORS.key).toBe('@cache_sponsors');
    });
  });
});