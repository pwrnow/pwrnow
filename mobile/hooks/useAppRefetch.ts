import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook that refetches all data when the app comes back to the foreground
 * This ensures users always see the latest data when they return to the app
 */
export function useAppRefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (Platform.OS === 'web') {
      return; // Skip on web platform
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App has come to the foreground, refetch all queries
        console.log('App became active, refetching all data...');

        // Refetch all queries in parallel
        queryClient.refetchQueries({
          type: 'active', // Only refetch active queries
        });

        // Also refetch individual events that are currently active
        refetchIndividualEvents();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
    };
  }, [queryClient]);

  // Return a manual refetch function for programmatic use
  const refetchAll = () => {
    console.log('Manually refetching all data...');
    return queryClient.refetchQueries({
      type: 'active',
    });
  };

  // Return a function to refetch specific data types
  const refetchEvents = () => {
    console.log('Refetching events data...');
    return queryClient.refetchQueries({
      queryKey: queryKeys.events,
    });
  };

  const refetchCategories = () => {
    console.log('Refetching categories data...');
    return queryClient.refetchQueries({
      queryKey: queryKeys.categories,
    });
  };

  const refetchEventBySlug = (slug: string) => {
    console.log(`Refetching event data for: ${slug}`);
    return queryClient.refetchQueries({
      queryKey: queryKeys.eventBySlug(slug),
    });
  };

  // Refetch all individual events that are currently active
  const refetchIndividualEvents = () => {
    console.log('Refetching individual events...');

    // Get all active queries and filter for event-related ones
    const activeQueries = queryClient.getQueryCache().findAll({
      type: 'active',
    });

    // Find all individual event queries (eventBySlug, eventPosts, eventSchedule)
    const eventQueries = activeQueries.filter((query) => {
      const queryKey = query.queryKey;
      return (
        Array.isArray(queryKey) &&
        queryKey.length >= 2 &&
        queryKey[0] === 'event' &&
        typeof queryKey[1] === 'string' // This is the slug
      );
    });

    // Refetch each individual event query
    const refetchPromises = eventQueries.map((query) => {
      console.log(`Refetching individual event query:`, query.queryKey);
      return queryClient.refetchQueries({
        queryKey: query.queryKey,
      });
    });

    return Promise.all(refetchPromises);
  };

  return {
    refetchAll,
    refetchEvents,
    refetchCategories,
    refetchEventBySlug,
    refetchIndividualEvents,
  };
}
