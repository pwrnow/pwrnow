import { QueryClient } from '@tanstack/react-query';
import { api } from './api';
import { queryKeys } from './queryKeys';

export class AppStartup {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Initialize the app by invalidating all cached data and fetching fresh data
   */
  async initialize(): Promise<void> {
    console.log('🚀 Starting app initialization...');

    try {
      // Step 1: Invalidate all cached data
      await this.invalidateAllData();

      // Step 2: Fetch essential data
      await this.fetchEssentialData();

      console.log('✅ App initialization completed successfully');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      // Don't throw - let the app continue with cached data if available
    }
  }

  /**
   * Invalidate all cached data to ensure fresh data on app start
   */
  private async invalidateAllData(): Promise<void> {
    console.log('🔄 Invalidating all cached data...');

    try {
      // Invalidate all queries
      await this.queryClient.invalidateQueries();

      // Clear all cached data
      this.queryClient.clear();

      console.log('✅ All cached data invalidated');
    } catch (error) {
      console.error('❌ Failed to invalidate cached data:', error);
    }
  }

  /**
   * Fetch essential data that the app needs immediately
   */
  private async fetchEssentialData(): Promise<void> {
    console.log('📡 Fetching essential data...');

    try {
      // Fetch categories first (needed for navigation)
      console.log('📂 Fetching categories...');
      await this.queryClient.prefetchQuery({
        queryKey: queryKeys.categories,
        queryFn: () => api.categories.getCategories(),
        staleTime: 30 * 60 * 1000, // 30 minutes
      });

      // Fetch events (main content)
      console.log('📅 Fetching events...');
      await this.queryClient.prefetchQuery({
        queryKey: queryKeys.events,
        queryFn: () => api.events.getEvents(),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });

      console.log('✅ Essential data fetched successfully');
    } catch (error) {
      console.error('❌ Failed to fetch essential data:', error);
      throw error;
    }
  }

  /**
   * Prefetch event details for better user experience
   * This can be called after the main app is loaded
   */
  async prefetchEventDetails(eventSlugs: string[]): Promise<void> {
    console.log(`🔄 Prefetching details for ${eventSlugs.length} events...`);

    const prefetchPromises = eventSlugs.map(async (slug, index) => {
      try {
        await this.queryClient.prefetchQuery({
          queryKey: queryKeys.eventBySlug(slug),
          queryFn: () => api.events.getEventBySlug(slug),
          staleTime: 10 * 60 * 1000, // 10 minutes
        });

        console.log(
          `✅ Prefetched event ${index + 1}/${eventSlugs.length}: ${slug}`
        );

        // Add small delay between requests to avoid overwhelming the server
        if (index < eventSlugs.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.warn(`⚠️ Failed to prefetch event ${slug}:`, error);
      }
    });

    await Promise.allSettled(prefetchPromises);
    console.log('✅ Event details prefetching completed');
  }
}

/**
 * Hook to use the app startup
 */
export function useAppStartup(queryClient: QueryClient) {
  return new AppStartup(queryClient);
}
