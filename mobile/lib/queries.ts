import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { queryKeys } from './queryKeys';
import type { Event, Category, Post } from '../types';

export function useEvents() {
  return useQuery<Event[]>({
    queryKey: queryKeys.events,
    queryFn: () => api.events.getEvents(),
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: queryKeys.categories,
    queryFn: () => api.categories.getCategories(),
  });
}

export function useEventBySlug(slug?: string) {
  return useQuery<Event>({
    queryKey: slug ? queryKeys.eventBySlug(slug) : ['event', ''],
    queryFn: () => api.events.getEventBySlug(slug as string),
    enabled: typeof slug === 'string' && slug.length > 0,
  });
}

export function useEventPosts(slug?: string) {
  return useQuery<Post[]>({
    queryKey: slug
      ? [...queryKeys.eventBySlug(slug), 'posts']
      : ['event', '', 'posts'],
    queryFn: () => api.events.getEventPosts(slug as string),
    enabled: typeof slug === 'string' && slug.length > 0,
  });
}

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
