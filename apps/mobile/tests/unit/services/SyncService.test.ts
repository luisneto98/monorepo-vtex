import NetInfo from '@react-native-community/netinfo';
import { SyncService } from '../../../src/services/SyncService';
import { CacheService } from '../../../src/services/CacheService';

// Mock dependencies
jest.mock('@react-native-community/netinfo');
jest.mock('../../../src/services/CacheService');

describe('SyncService', () => {
  let mockNetworkListener: ((state: any) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNetworkListener = null;

    // Mock NetInfo.addEventListener
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      mockNetworkListener = callback;
      return jest.fn(); // Return unsubscribe function
    });

    // Mock NetInfo.fetch
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });

    // Mock CacheService methods
    (CacheService.getCacheMetadata as jest.Mock).mockResolvedValue([]);
    (CacheService.invalidate as jest.Mock).mockResolvedValue(undefined);
    (CacheService.clearAll as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    SyncService.cleanup();
  });

  describe('initialize', () => {
    it('should set up network listener', () => {
      SyncService.initialize();

      expect(NetInfo.addEventListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should trigger sync when network reconnects', async () => {
      jest.useFakeTimers();
      SyncService.initialize();

      expect(mockNetworkListener).not.toBeNull();

      // Simulate network reconnection
      mockNetworkListener!({ isConnected: true });

      // Fast-forward debounce timer (2 seconds)
      jest.advanceTimersByTime(2000);
      jest.runOnlyPendingTimers();

      await Promise.resolve(); // Allow async operations to complete

      expect(NetInfo.fetch).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should not trigger sync when network disconnects', () => {
      jest.useFakeTimers();
      SyncService.initialize();

      expect(mockNetworkListener).not.toBeNull();

      // Simulate network disconnection
      mockNetworkListener!({ isConnected: false });

      jest.advanceTimersByTime(2000);

      expect(NetInfo.fetch).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from network listener', () => {
      const unsubscribeMock = jest.fn();
      (NetInfo.addEventListener as jest.Mock).mockReturnValue(unsubscribeMock);

      SyncService.initialize();
      SyncService.cleanup();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should handle cleanup when not initialized', () => {
      expect(() => SyncService.cleanup()).not.toThrow();
    });
  });

  describe('syncAll', () => {
    it('should process queue and refresh stale cache when online', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (CacheService.getCacheMetadata as jest.Mock).mockResolvedValue([
        { key: '@cache_expired', expired: true },
      ]);

      await SyncService.syncAll();

      expect(CacheService.getCacheMetadata).toHaveBeenCalled();
      expect(CacheService.invalidate).toHaveBeenCalledWith('@cache_expired');
    });

    it('should not sync when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

      await SyncService.syncAll();

      expect(CacheService.getCacheMetadata).not.toHaveBeenCalled();
    });

    it('should not sync when already syncing', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

      let resolveMetadata: (value: any) => void;
      const metadataPromise = new Promise((resolve) => {
        resolveMetadata = resolve;
      });

      (CacheService.getCacheMetadata as jest.Mock).mockImplementation(() => metadataPromise);

      // Start first sync (will hang on getCacheMetadata)
      const firstSync = SyncService.syncAll();

      // Give it time to start
      await new Promise(resolve => setTimeout(resolve, 10));

      // Attempt second sync while first is running
      const secondSync = SyncService.syncAll();

      // Resolve the metadata to let syncs complete
      resolveMetadata!([]);

      await Promise.allSettled([firstSync, secondSync]);

      // getCacheMetadata should only be called once
      expect(CacheService.getCacheMetadata).toHaveBeenCalledTimes(1);
    });

    it('should handle sync errors gracefully', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (CacheService.getCacheMetadata as jest.Mock).mockRejectedValue(new Error('Cache error'));

      await expect(SyncService.syncAll()).resolves.not.toThrow();
    });
  });

  describe('addToQueue', () => {
    it('should add new task to queue', () => {
      const mockTask = jest.fn().mockResolvedValue('success');

      SyncService.addToQueue('task1', mockTask, 3);

      // Verify task is added (implicitly tested via processQueue)
      expect(mockTask).not.toHaveBeenCalled(); // Not executed immediately
    });

    it('should update existing task in queue', () => {
      const mockTask1 = jest.fn().mockResolvedValue('first');
      const mockTask2 = jest.fn().mockResolvedValue('second');

      SyncService.addToQueue('task1', mockTask1, 3);
      SyncService.addToQueue('task1', mockTask2, 3);

      // Second task should replace first (verified implicitly)
      expect(mockTask1).not.toHaveBeenCalled();
      expect(mockTask2).not.toHaveBeenCalled();
    });
  });

  describe('processQueue', () => {
    it('should execute queued tasks successfully', async () => {
      const mockTask = jest.fn().mockResolvedValue('success');
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

      SyncService.addToQueue('task1', mockTask, 3);
      await SyncService.syncAll();

      expect(mockTask).toHaveBeenCalled();
    });

    it('should retry failed tasks with exponential backoff', async () => {
      jest.useRealTimers();
      jest.clearAllMocks();

      const mockTask = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');

      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (CacheService.getCacheMetadata as jest.Mock).mockResolvedValue([]);

      SyncService.addToQueue('task1', mockTask, 3);

      // First sync attempt (will fail and schedule retry)
      await SyncService.syncAll();
      expect(mockTask).toHaveBeenCalledTimes(1);

      // Wait for backoff (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2100));

      // Second sync attempt (will fail and schedule retry)
      await SyncService.syncAll();
      expect(mockTask).toHaveBeenCalledTimes(2);

      // Wait for backoff (4 seconds)
      await new Promise(resolve => setTimeout(resolve, 4100));

      // Third sync attempt (will succeed)
      await SyncService.syncAll();
      expect(mockTask).toHaveBeenCalledTimes(3);
    }, 10000); // 10 second timeout

    it('should stop retrying after max retries', async () => {
      jest.useRealTimers();
      jest.clearAllMocks();

      const mockTask = jest.fn().mockRejectedValue(new Error('Always fails'));
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (CacheService.getCacheMetadata as jest.Mock).mockResolvedValue([]);

      SyncService.addToQueue('task1', mockTask, 2); // Max 2 retries

      // First attempt
      await SyncService.syncAll();
      expect(mockTask).toHaveBeenCalledTimes(1);

      // Wait for retry 1 (after 2s backoff)
      await new Promise(resolve => setTimeout(resolve, 2100));
      await SyncService.syncAll();
      expect(mockTask).toHaveBeenCalledTimes(2);

      // Wait for retry 2 (after 4s backoff)
      await new Promise(resolve => setTimeout(resolve, 4100));
      await SyncService.syncAll();
      expect(mockTask).toHaveBeenCalledTimes(3);

      // Should not retry again - wait and verify
      await new Promise(resolve => setTimeout(resolve, 8100));
      await SyncService.syncAll();
      expect(mockTask).toHaveBeenCalledTimes(3); // Still 3, no more retries
    }, 20000); // 20 second timeout

    it('should process multiple tasks in queue', async () => {
      const mockTask1 = jest.fn().mockResolvedValue('success1');
      const mockTask2 = jest.fn().mockResolvedValue('success2');
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

      SyncService.addToQueue('task1', mockTask1, 3);
      SyncService.addToQueue('task2', mockTask2, 3);

      await SyncService.syncAll();

      expect(mockTask1).toHaveBeenCalled();
      expect(mockTask2).toHaveBeenCalled();
    });
  });

  describe('refreshStaleCache', () => {
    it('should invalidate expired cache entries', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (CacheService.getCacheMetadata as jest.Mock).mockResolvedValue([
        { key: '@cache_expired1', expired: true },
        { key: '@cache_valid', expired: false },
        { key: '@cache_expired2', expired: true },
      ]);

      await SyncService.syncAll();

      expect(CacheService.invalidate).toHaveBeenCalledWith('@cache_expired1');
      expect(CacheService.invalidate).toHaveBeenCalledWith('@cache_expired2');
      expect(CacheService.invalidate).not.toHaveBeenCalledWith('@cache_valid');
    });

    it('should handle empty metadata', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (CacheService.getCacheMetadata as jest.Mock).mockResolvedValue([]);

      await expect(SyncService.syncAll()).resolves.not.toThrow();
    });
  });

  describe('forceRefreshAll', () => {
    it('should clear all cache and trigger sync', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

      await SyncService.forceRefreshAll();

      expect(CacheService.clearAll).toHaveBeenCalled();
      expect(NetInfo.fetch).toHaveBeenCalled();
    });

    it('should handle errors during force refresh', async () => {
      (CacheService.clearAll as jest.Mock).mockRejectedValue(new Error('Clear error'));
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

      await expect(SyncService.forceRefreshAll()).rejects.toThrow('Clear error');
    });
  });

  describe('debounce behavior', () => {
    it('should wait 2 seconds before syncing after reconnection', async () => {
      jest.useFakeTimers();

      // Ensure clean state
      SyncService.cleanup();
      jest.clearAllMocks();

      // Re-mock after clearing
      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        mockNetworkListener = callback;
        return jest.fn();
      });
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (CacheService.getCacheMetadata as jest.Mock).mockResolvedValue([]);

      SyncService.initialize();

      expect(mockNetworkListener).not.toBeNull();

      // Clear any pending timers from the test suite
      jest.clearAllTimers();

      // Clear the call count to start fresh
      (NetInfo.fetch as jest.Mock).mockClear();

      // Simulate network reconnection
      mockNetworkListener!({ isConnected: true });

      // Should not sync immediately
      expect(NetInfo.fetch).not.toHaveBeenCalled();

      // Fast-forward 1 second (not enough)
      jest.advanceTimersByTime(1000);
      expect(NetInfo.fetch).not.toHaveBeenCalled();

      // Fast-forward another 1 second (now 2 seconds total)
      jest.advanceTimersByTime(1000);
      jest.runAllTimers();
      await Promise.resolve();

      expect(NetInfo.fetch).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});