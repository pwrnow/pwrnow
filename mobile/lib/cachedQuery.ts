import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { cacheManager } from './cacheManager';
import { isOffline } from './network';

interface CachedQueryOptions<TData, TError = Error>
  extends Omit<UseQueryOptions<TData, TError>, 'queryFn'> {
  queryFn: () => Promise<TData>;
  queryKey: readonly unknown[];
  // Optional: Force network request even if offline
  forceNetwork?: boolean;
  // Optional: Custom cache key (defaults to queryKey)
  cacheKey?: readonly unknown[];
}

/**
 * Enhanced useQuery hook that automatically handles caching and fallback to local data
 * when network requests fail. This provides seamless offline support for your app.
 *
 * @param options - Query options including queryFn, queryKey, and optional cache settings
 * @returns Query result with automatic cache fallback
 */
export function useCachedQuery<TData = unknown, TError = Error>(
  options: CachedQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const {
    queryFn,
    queryKey,
    forceNetwork = false,
    cacheKey = queryKey,
    ...queryOptions
  } = options;

  // Create a wrapper query function that handles caching
  const cachedQueryFn = async (): Promise<TData> => {
    try {
      // Try to fetch fresh data from network
      const freshData = await queryFn();

      // If successful, cache the data
      await cacheManager.set(cacheKey as string[], freshData);

      return freshData;
    } catch (error) {
      // Network request failed, try to get data from cache
      const cachedData = await cacheManager.get<TData>(cacheKey as string[]);

      if (cachedData) {
        // Log that we're using cached data due to network error
        console.warn(`Using cached data due to network error for query ${JSON.stringify(cacheKey)}:`, error);
        return cachedData;
      }

      // No cached data available, rethrow the original error
      throw error;
    }
  };

  // Determine if we should attempt network request
  const shouldAttemptNetwork = forceNetwork || !isOffline();

  return useQuery<TData, TError>({
    ...queryOptions,
    queryKey,
    queryFn: cachedQueryFn,
    // Only retry if we're online and haven't forced network
    retry: shouldAttemptNetwork ? queryOptions.retry : false,
  });
}

/**
 * Hook to manually manage cache operations
 */
export function useCacheManager() {
  return {
    // Get cached data for a specific query
    getCachedData: <T>(queryKey: readonly unknown[]) =>
      cacheManager.get<T>(queryKey as string[]),

    // Set cached data for a specific query
    setCachedData: <T>(queryKey: readonly unknown[], data: T) =>
      cacheManager.set(queryKey as string[], data),

    // Remove cached data for a specific query
    removeCachedData: (queryKey: readonly unknown[]) =>
      cacheManager.remove(queryKey as string[]),

    // Clear all cached data
    clearAllCache: () => cacheManager.clear(),

    // Get cache statistics
    getCacheStats: () => cacheManager.getCacheStats(),
  };
}

/**
 * Utility function to prefetch and cache data
 */
export async function prefetchAndCache<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
): Promise<T | null> {
  try {
    const data = await queryFn();
    await cacheManager.set(queryKey as string[], data);
    return data;
  } catch (error) {
    console.warn(
      `Failed to prefetch data for ${JSON.stringify(queryKey)}:`,
      error
    );
    return null;
  }
}

/**
 * Utility function to check if data exists in cache
 */
export async function hasCachedData(
  queryKey: readonly unknown[]
): Promise<boolean> {
  const data = await cacheManager.get(queryKey as string[]);
  return data !== null;
}
