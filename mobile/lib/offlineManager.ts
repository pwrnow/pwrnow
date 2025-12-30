import { cacheManager } from './cacheManager';
import { imageCacheManager } from './imageCache';
import { imagePreloader } from './imagePreloader';
import { api } from './api';
import { queryKeys } from './queryKeys';
import { isOnline, shouldAttemptNetworkRequest } from './network';
import type { Event, Category } from '../types';

export interface OfflineState {
  isOnline: boolean;
  hasCachedEvents: boolean;
  hasCachedImages: boolean;
  lastSyncTime: number | null;
}

export interface CacheSyncResult {
  success: boolean;
  eventsCount: number;
  imagesCount: number;
  error?: string;
}

export class OfflineManager {
  private static instance: OfflineManager;
  private syncInProgress = false;

  private constructor() {}

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  /**
   * Get current offline state
   */
  async getOfflineState(): Promise<OfflineState> {
    const isOnline = shouldAttemptNetworkRequest();
    
    // Check if we have cached events
    const cachedEvents = await cacheManager.get<Event[]>([...queryKeys.events]);
    const hasCachedEvents = cachedEvents !== null && cachedEvents.length > 0;

    // Check if we have cached images
    const imageStats = imageCacheManager.getCacheStats();
    const hasCachedImages = imageStats.count > 0;

    // Get last sync time from cache
    const lastSyncData = await cacheManager.get<{ timestamp: number }>(['last_sync']);
    const lastSyncTime = lastSyncData?.timestamp || null;

    return {
      isOnline,
      hasCachedEvents,
      hasCachedImages,
      lastSyncTime,
    };
  }

  /**
   * Sync data when online - download events and cache images
   */
  async syncData(): Promise<CacheSyncResult> {
    if (this.syncInProgress) {
      return { success: false, eventsCount: 0, imagesCount: 0, error: 'Sync already in progress' };
    }

    if (!shouldAttemptNetworkRequest()) {
      return { success: false, eventsCount: 0, imagesCount: 0, error: 'No internet connection' };
    }

    this.syncInProgress = true;

    try {
      let eventsCount = 0;
      let imagesCount = 0;

      // Fetch and cache events
      console.log('Syncing events data...');
      const events = await api.events.getEvents();
      await cacheManager.set([...queryKeys.events], events);
      eventsCount = events.length;

      // Fetch and cache categories
      console.log('Syncing categories data...');
      const categories = await api.categories.getCategories();
      await cacheManager.set([...queryKeys.categories], categories);

      // Use image preloader for efficient caching
      console.log('Preloading event images...');
      try {
        await imagePreloader.preloadEventImages(events, 'high');

        // Also preload upcoming events in background
        imagePreloader.preloadUpcomingEvents(events);

        // Get count of cached images
        const imageStats = imageCacheManager.getCacheStats();
        imagesCount = imageStats.count;
      } catch (preloadError) {
        console.warn('Image preloading failed, continuing with sync:', preloadError);
        // Continue with sync even if image preloading fails
        const imageStats = imageCacheManager.getCacheStats();
        imagesCount = imageStats.count;
      }

      // Update last sync time
      await cacheManager.set(['last_sync'], { timestamp: Date.now() });

      console.log(`Sync completed: ${eventsCount} events, ${imagesCount} images cached`);

      return {
        success: true,
        eventsCount,
        imagesCount,
      };
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        success: false,
        eventsCount: 0,
        imagesCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get cached events data
   */
  async getCachedEvents(): Promise<Event[]> {
    const cachedEvents = await cacheManager.get<Event[]>([...queryKeys.events]);
    return cachedEvents || [];
  }

  /**
   * Get cached categories data
   */
  async getCachedCategories(): Promise<Category[]> {
    const cachedCategories = await cacheManager.get<Category[]>([...queryKeys.categories]);
    return cachedCategories || [];
  }

  /**
   * Get cached event by slug
   */
  async getCachedEvent(slug: string): Promise<Event | null> {
    return await cacheManager.get<Event>([...queryKeys.eventBySlug(slug)]);
  }

  /**
   * Check if we have any cached data
   */
  async hasCachedData(): Promise<boolean> {
    const events = await this.getCachedEvents();
    const categories = await this.getCachedCategories();
    return events.length > 0 || categories.length > 0;
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await Promise.all([
      cacheManager.clear(),
      imageCacheManager.clearCache(),
    ]);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const cacheStats = cacheManager.getCacheStats();
    const imageStats = imageCacheManager.getCacheStats();
    
    return {
      data: cacheStats,
      images: imageStats,
    };
  }
}

export const offlineManager = OfflineManager.getInstance();
