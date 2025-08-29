import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { queryKeys } from './queryKeys';
import type { Event, Category } from '../types';

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

// Like/Unlike mutations
export function useLikeEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => api.events.like(slug),
    onSuccess: (_, slug) => {
      // Invalidate and refetch events list - force refetch even if not active
      queryClient.invalidateQueries({
        queryKey: queryKeys.events,
        refetchType: 'all', // Refetch both active and inactive queries
      });
      // Invalidate and refetch specific event details
      queryClient.invalidateQueries({
        queryKey: queryKeys.eventBySlug(slug),
        refetchType: 'all',
      });
    },
  });
}

export function useUnlikeEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => api.events.unlike(slug),
    onSuccess: (_, slug) => {
      // Invalidate and refetch events list - force refetch even if not active
      queryClient.invalidateQueries({
        queryKey: queryKeys.events,
        refetchType: 'all', // Refetch both active and inactive queries
      });
      // Invalidate and refetch specific event details
      queryClient.invalidateQueries({
        queryKey: queryKeys.eventBySlug(slug),
        refetchType: 'all',
      });
    },
  });
}
