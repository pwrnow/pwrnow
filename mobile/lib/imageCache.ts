import { File, Directory, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IMAGE_CACHE_DIR = new Directory(Paths.cache, 'images');
const IMAGE_CACHE_PREFIX = 'pwrnow_image_cache_';
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedImageInfo {
  url: string;
  localPath: string;
  timestamp: number;
  size: number;
}

export class ImageCacheManager {
  private static instance: ImageCacheManager;
  private cacheInfo: Map<string, CachedImageInfo> = new Map();

  private constructor() {
    this.initializeCache();
  }

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  private async initializeCache(): Promise<void> {
    try {
      // Ensure cache directory exists
      if (!IMAGE_CACHE_DIR.exists) {
        IMAGE_CACHE_DIR.create();
      }

      // Load cache info from AsyncStorage
      await this.loadCacheInfo();

      // Clean up old cache entries
      await this.cleanupCache();
    } catch (error) {
      console.warn('Failed to initialize image cache:', error);
    }
  }

  private async loadCacheInfo(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const imageCacheKeys = keys.filter(key => key.startsWith(IMAGE_CACHE_PREFIX));

      if (imageCacheKeys.length === 0) return;

      const cacheData = await AsyncStorage.multiGet(imageCacheKeys);

      for (const [key, value] of cacheData) {
        if (value) {
          try {
            const info = JSON.parse(value) as CachedImageInfo;
            // Check if file still exists
            const file = new File(info.localPath);
            if (file.exists) {
              this.cacheInfo.set(info.url, info);
            }
          } catch (error) {
            console.warn(`Failed to parse cache info for key ${key}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load image cache info:', error);
    }
  }

  private async saveCacheInfo(url: string, info: CachedImageInfo): Promise<void> {
    try {
      this.cacheInfo.set(url, info);
      const key = `${IMAGE_CACHE_PREFIX}${this.hashUrl(url)}`;
      await AsyncStorage.setItem(key, JSON.stringify(info));
    } catch (error) {
      console.warn('Failed to save image cache info:', error);
    }
  }

  private hashUrl(url: string): string {
    // Simple hash function for URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async cleanupCache(): Promise<void> {
    try {
      const now = Date.now();
      const entriesToDelete: string[] = [];

      // Remove expired entries
      for (const [url, info] of this.cacheInfo.entries()) {
        if (now - info.timestamp > MAX_CACHE_AGE) {
          entriesToDelete.push(url);
        }
      }

      // Remove entries if cache is too large
      const totalSize = Array.from(this.cacheInfo.values())
        .reduce((sum, info) => sum + info.size, 0);

      if (totalSize > MAX_CACHE_SIZE) {
        // Sort by timestamp (oldest first)
        const sortedEntries = Array.from(this.cacheInfo.entries())
          .sort(([, a], [, b]) => a.timestamp - b.timestamp);

        let currentSize = totalSize;
        for (const [url, info] of sortedEntries) {
          if (currentSize <= MAX_CACHE_SIZE * 0.8) break; // Keep 80% of max size
          entriesToDelete.push(url);
          currentSize -= info.size;
        }
      }

      // Delete expired/old entries
      for (const url of entriesToDelete) {
        await this.removeCachedImage(url);
      }
    } catch (error) {
      console.warn('Failed to cleanup image cache:', error);
    }
  }

  async getCachedImage(url: string): Promise<string | null> {
    try {
      const info = this.cacheInfo.get(url);
      if (!info) return null;

      // Check if file still exists
      const file = new File(info.localPath);
      if (!file.exists) {
        this.cacheInfo.delete(url);
        return null;
      }

      // Check if cache entry is still valid
      const now = Date.now();
      if (now - info.timestamp > MAX_CACHE_AGE) {
        await this.removeCachedImage(url);
        return null;
      }

      return info.localPath;
    } catch (error) {
      console.warn('Failed to get cached image:', error);
      return null;
    }
  }

  async cacheImage(url: string): Promise<string | null> {
    try {
      // Check if already cached
      const cachedPath = await this.getCachedImage(url);
      if (cachedPath) return cachedPath;

      // Download and cache the image
      const destination = new File(IMAGE_CACHE_DIR, `${this.hashUrl(url)}.jpg`);
      const downloadedFile = await File.downloadFileAsync(url, destination, { idempotent: true });

      const localPath = downloadedFile.uri;
      const info: CachedImageInfo = {
        url,
        localPath,
        timestamp: Date.now(),
        size: downloadedFile.size ?? 0,
      };

      await this.saveCacheInfo(url, info);
      return localPath;
    } catch (error) {
      console.warn('Failed to cache image:', error);
      return null;
    }
  }

  async removeCachedImage(url: string): Promise<void> {
    try {
      const info = this.cacheInfo.get(url);
      if (info) {
        // Remove file
        const file = new File(info.localPath);
        if (file.exists) {
          file.delete();
        }

        // Remove from cache info
        this.cacheInfo.delete(url);

        // Remove from AsyncStorage
        const key = `${IMAGE_CACHE_PREFIX}${this.hashUrl(url)}`;
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Failed to remove cached image:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      // Remove all cached files
      if (IMAGE_CACHE_DIR.exists) {
        IMAGE_CACHE_DIR.delete();
        IMAGE_CACHE_DIR.create();
      }

      // Clear cache info
      this.cacheInfo.clear();

      // Remove from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const imageCacheKeys = keys.filter(key => key.startsWith(IMAGE_CACHE_PREFIX));
      await AsyncStorage.multiRemove(imageCacheKeys);
    } catch (error) {
      console.warn('Failed to clear image cache:', error);
    }
  }

  getCacheStats(): { count: number; totalSize: number; urls: string[] } {
    const totalSize = Array.from(this.cacheInfo.values())
      .reduce((sum, info) => sum + info.size, 0);

    return {
      count: this.cacheInfo.size,
      totalSize,
      urls: Array.from(this.cacheInfo.keys()),
    };
  }
}

export const imageCacheManager = ImageCacheManager.getInstance();
