import NetInfo from '@react-native-community/netinfo';
import { CacheService, CACHE_CONFIGS } from './CacheService';

interface SyncTask {
  id: string;
  execute: () => Promise<any>;
  retries: number;
  maxRetries: number;
}

/**
 * Service for managing background data synchronization
 */
export class SyncService {
  private static syncQueue: SyncTask[] = [];
  private static isSyncing = false;
  private static networkUnsubscribe: (() => void) | null = null;

  /**
   * Initialize sync service with network listener
   */
  static initialize(): void {
    // Listen for network changes
    this.networkUnsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.isSyncing) {
        // Debounce sync by 2 seconds
        setTimeout(() => {
          this.syncAll();
        }, 2000);
      }
    });
  }

  /**
   * Clean up listeners
   */
  static cleanup(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
  }

  /**
   * Sync all cached data
   */
  static async syncAll(): Promise<void> {
    if (this.isSyncing) {
      return;
    }

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return;
    }

    this.isSyncing = true;

    try {
      console.log('Starting data synchronization...');

      // Process retry queue first
      await this.processQueue();

      // Invalidate and refresh stale cache
      await this.refreshStaleCache();

      console.log('Data synchronization completed');
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Add task to retry queue
   */
  static addToQueue(id: string, task: () => Promise<any>, maxRetries: number = 3): void {
    const existingIndex = this.syncQueue.findIndex((t) => t.id === id);

    if (existingIndex !== -1) {
      // Update existing task
      this.syncQueue[existingIndex] = {
        id,
        execute: task,
        retries: 0,
        maxRetries,
      };
    } else {
      // Add new task
      this.syncQueue.push({
        id,
        execute: task,
        retries: 0,
        maxRetries,
      });
    }
  }

  /**
   * Process retry queue
   */
  private static async processQueue(): Promise<void> {
    if (this.syncQueue.length === 0) {
      return;
    }

    const tasks = [...this.syncQueue];
    this.syncQueue = [];

    for (const task of tasks) {
      try {
        await task.execute();
        console.log(`Task ${task.id} completed successfully`);
      } catch (error) {
        console.error(`Task ${task.id} failed:`, error);

        // Retry with exponential backoff
        if (task.retries < task.maxRetries) {
          task.retries++;
          const backoffDelay = Math.pow(2, task.retries) * 1000; // 2s, 4s, 8s

          setTimeout(() => {
            this.syncQueue.push(task);
          }, backoffDelay);
        }
      }
    }
  }

  /**
   * Refresh stale cache entries
   */
  private static async refreshStaleCache(): Promise<void> {
    const metadata = await CacheService.getCacheMetadata();

    for (const entry of metadata) {
      if (entry.expired) {
        console.log(`Refreshing expired cache: ${entry.key}`);
        await CacheService.invalidate(entry.key);
      }
    }
  }

  /**
   * Force refresh all cache
   */
  static async forceRefreshAll(): Promise<void> {
    await CacheService.clearAll();
    await this.syncAll();
  }
}