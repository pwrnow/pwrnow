import { useQuery } from '@tanstack/react-query';
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
