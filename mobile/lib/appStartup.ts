import { QueryClient } from '@tanstack/react-query';
import { offlineManager } from './offlineManager';
import { imageCacheManager } from './imageCache';

export class AppStartup {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize offline manager (no explicit init needed)
      // await offlineManager.initialize();
      
      // Initialize image cache (non-blocking)
      // We don't await this to speed up startup
      // ImageCacheManager initializes itself in constructor, but we can access it here to ensure it's alive
      const cacheStats = imageCacheManager.getCacheStats();
      console.log(`Image cache initialized with ${cacheStats.count} items`);

      console.log('App initialization tasks completed');
    } catch (error) {
      console.error('Error during app startup:', error);
      throw error;
    }
  }
}
