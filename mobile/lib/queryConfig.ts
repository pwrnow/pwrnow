// Global configuration for React Query client
// Modify these values to adjust caching, retry, and offline behavior

export const queryConfig = {
  // Cache duration settings
  staleTime: {
    // How long data is considered fresh (will not trigger refetch)
    default: 0, // 5 minutes
  },

  // Garbage collection time (how long data stays in cache)
  gcTime: {
    default: 2 * 24 * 60 * 60 * 1000, // 2 days
  },

  // Retry settings
  retry: {
    queries: {
      maxAttempts: 1, // Reduced to 1 retry for faster user experience
      delay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 3000), // Reduced max delay to 3 seconds
    },
    mutations: {
      maxAttempts: 1,
      delay: 1000, // Keep at 1 second for mutations
    },
  },

  // Persistence settings
  persistence: {
    storageKey: 'pwrnow-query-cache',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    buster: 'v1', // Change this to invalidate all cached data
  },

  // Network behavior
  network: {
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    networkMode: 'online' as const,
  },
};
