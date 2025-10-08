import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from './cachedQuery';
import { api } from './api';
import { queryKeys } from './queryKeys';
import type { Event, Category, Post, User } from '../types';

export function useEvents() {
  return useCachedQuery<Event[]>({
    queryKey: queryKeys.events,
    queryFn: () => api.events.getEvents(),
    staleTime: 0, // Always consider stale to allow refetching
  });
}

export function useCategories() {
  return useCachedQuery<Category[]>({
    queryKey: queryKeys.categories,
    queryFn: () => api.categories.getCategories(),
    staleTime: 0, // Always consider stale to allow refetching
  });
}

export function useUser(enabled: boolean = true) {
  return useQuery<User>({
    queryKey: queryKeys.user,
    queryFn: () => api.user.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes - user data doesn't change often
    retry: 1,
    enabled, // Only fetch when enabled (authenticated)
  });
}

export function useEventBySlug(slug?: string) {
  return useCachedQuery<Event>({
    queryKey: slug ? queryKeys.eventBySlug(slug) : ['event', ''],
    queryFn: () => api.events.getEventBySlug(slug as string),
    enabled: typeof slug === 'string' && slug.length > 0,
  });
}

// Note: useEventPosts and useEventSchedule are no longer needed
// as posts and schedule are now included in the event details response

export function useLikeEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => api.events.like(slug),
    onMutate: async (slug: string) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.events });
      await queryClient.cancelQueries({
        queryKey: queryKeys.eventBySlug(slug),
      });

      // Snapshot the previous values
      const previousEvents = queryClient.getQueryData<Event[]>(
        queryKeys.events
      );
      const previousEvent = queryClient.getQueryData<Event>(
        queryKeys.eventBySlug(slug)
      );

      // Optimistically update events list
      if (previousEvents) {
        queryClient.setQueryData<Event[]>(
          queryKeys.events,
          (old) =>
            old?.map((event) =>
              event.slug === slug
                ? {
                    ...event,
                    liked: true,
                  }
                : event
            ) || []
        );
      }

      // Optimistically update specific event
      if (previousEvent) {
        queryClient.setQueryData<Event>(queryKeys.eventBySlug(slug), {
          ...previousEvent,
          liked: true,
        });
      }

      // Return context for rollback
      return { previousEvents, previousEvent };
    },
    onSettled: () => {
      // Refetch queries to ensure the UI is immediately updated
      queryClient.refetchQueries({ queryKey: queryKeys.events });
    },
    onError: (err, slug, context) => {
      // Rollback on error
      if (context?.previousEvents) {
        queryClient.setQueryData(queryKeys.events, context.previousEvents);
      }
      if (context?.previousEvent) {
        queryClient.setQueryData(
          queryKeys.eventBySlug(slug),
          context.previousEvent
        );
      }
    },
  });
}

export function useUnlikeEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => api.events.unlike(slug),
    onMutate: async (slug: string) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.events });
      await queryClient.cancelQueries({
        queryKey: queryKeys.eventBySlug(slug),
      });

      // Snapshot the previous values
      const previousEvents = queryClient.getQueryData<Event[]>(
        queryKeys.events
      );
      const previousEvent = queryClient.getQueryData<Event>(
        queryKeys.eventBySlug(slug)
      );

      // Optimistically update events list
      if (previousEvents) {
        queryClient.setQueryData<Event[]>(
          queryKeys.events,
          (old) =>
            old?.map((event) =>
              event.slug === slug ? { ...event, liked: false } : event
            ) || []
        );
      }

      // Optimistically update specific event
      if (previousEvent) {
        queryClient.setQueryData<Event>(queryKeys.eventBySlug(slug), {
          ...previousEvent,
          liked: false,
        });
      }

      // Return context for rollback
      return { previousEvents, previousEvent };
    },
    onSettled: () => {
      // Refetch queries to ensure the UI is immediately updated
      queryClient.refetchQueries({ queryKey: queryKeys.events });
    },
    onError: (err, slug, context) => {
      // Rollback on error
      if (context?.previousEvents) {
        queryClient.setQueryData(queryKeys.events, context.previousEvents);
      }
      if (context?.previousEvent) {
        queryClient.setQueryData(
          queryKeys.eventBySlug(slug),
          context.previousEvent
        );
      }
    },
  });
}

// Prefetch functions for event details
export function usePrefetchEventDetails() {
  const queryClient = useQueryClient();

  const prefetchEventDetails = async (eventSlug: string) => {
    // Prefetch event details (now includes posts and schedule)
    await queryClient.prefetchQuery({
      queryKey: queryKeys.eventBySlug(eventSlug),
      queryFn: () => api.events.getEventBySlug(eventSlug),
      staleTime: 0, // Always consider stale to allow refetching
    });
  };

  const prefetchAllEventDetails = async (
    eventSlugs: string[],
    delayMs: number = 3000 // Reduced to 3 seconds for better user experience
  ) => {
    for (let i = 0; i < eventSlugs.length; i++) {
      const eventSlug = eventSlugs[i];

      try {
        await prefetchEventDetails(eventSlug);
      } catch (error) {
        console.warn(
          `Failed to prefetch details for event ${eventSlug}:`,
          error
        );
      }

      // Add delay between requests (except for the last one)
      if (i < eventSlugs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  };

  return {
    prefetchEventDetails,
    prefetchAllEventDetails,
  };
}
