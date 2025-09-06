import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryConfig } from './queryConfig';

const CACHE_PREFIX = 'pwrnow_cache_';
const CACHE_VERSION = 'v1';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry<any>> = new Map();

  private constructor() {
    this.loadCacheFromStorage();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private async loadCacheFromStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

      if (cacheKeys.length === 0) return;

      const cacheData = await AsyncStorage.multiGet(cacheKeys);

      for (const [key, value] of cacheData) {
        if (value) {
          try {
            const parsed = JSON.parse(value) as CacheEntry<any>;
            // Check if cache entry is still valid
            if (this.isCacheValid(parsed)) {
              const queryKey = key.replace(CACHE_PREFIX, '');
              this.cache.set(queryKey, parsed);
            }
          } catch (error) {
            console.warn(`Failed to parse cache entry for key ${key}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private isCacheValid(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    const maxAge = queryConfig.persistence.maxAge;

    // Check version compatibility
    if (entry.version !== CACHE_VERSION) {
      return false;
    }

    // Check if cache entry is not too old
    return now - entry.timestamp < maxAge;
  }

  private getCacheKey(queryKey: string[]): string {
    return `${CACHE_PREFIX}${JSON.stringify(queryKey)}`;
  }

  async get<T>(queryKey: string[]): Promise<T | null> {
    const key = JSON.stringify(queryKey);
    const entry = this.cache.get(key);

    if (!entry || !this.isCacheValid(entry)) {
      return null;
    }

    return entry.data as T;
  }

  async set<T>(queryKey: string[], data: T): Promise<void> {
    const key = JSON.stringify(queryKey);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };

    this.cache.set(key, entry);

    try {
      const storageKey = this.getCacheKey(queryKey);
      await AsyncStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  async remove(queryKey: string[]): Promise<void> {
    const key = JSON.stringify(queryKey);
    this.cache.delete(key);

    try {
      const storageKey = this.getCacheKey(queryKey);
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove cache from storage:', error);
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Failed to clear cache from storage:', error);
    }
  }

  // Get cache statistics for debugging
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cacheManager = CacheManager.getInstance();
