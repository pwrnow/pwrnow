import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  useCategories,
  useEvents,
  usePrefetchEventDetails,
} from '../lib/queries';
import { t } from '../lib/i18n';
import { Category, Event } from '../types';

interface UseEventsFeedOptions {
  filterLiked?: boolean;
}

export function useEventsFeed(options: UseEventsFeedOptions = {}) {
  const { filterLiked = false } = options;
  
  const [selectedCategory, setSelectedCategory] = useState('wszystkie');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { prefetchAllEventDetails } = usePrefetchEventDetails();
  const hasPrefetchedRef = useRef(false);

  const {
    data: events = [],
    isFetching: isFetchingEvents,
    isRefetching: isRefetchingEvents,
  } = useEvents();

  const {
    data: fetchedCategories = [],
    isFetching: isFetchingCategories,
    isRefetching: isRefetchingCategories,
  } = useCategories();

  // Filter events based on options
  const baseEvents = filterLiked
    ? events.filter((event) => event.liked === true)
    : events;

  // Prefetch event details when events are loaded (only once)
  useEffect(() => {
    if (events.length > 0 && !hasPrefetchedRef.current) {
      const eventSlugs = events.map((event) => event.slug);
      prefetchAllEventDetails(eventSlugs, 500).catch((error) => {
        console.warn('Failed to prefetch event details:', error);
      });
      hasPrefetchedRef.current = true;
    }
  }, [events.length, prefetchAllEventDetails]);

  // Compose categories with the localized "All"
  const categories: Category[] = [
    { name: t('all'), slug: 'wszystkie' },
    ...fetchedCategories,
  ];

  // Compute filtered events based on selected category
  const categoryFilteredEvents =
    selectedCategory === 'wszystkie'
      ? baseEvents.filter((event) => event.category.slug !== 'rekrutacja')
      : baseEvents.filter((event) => event.category.slug === selectedCategory);

  // Sort events to show unverified events at the top
  const filteredEvents = categoryFilteredEvents.sort((a, b) => {
    // If both events have the same verification status, maintain original order
    if (a.verified === b.verified) return 0;
    
    // Unverified events (verified === false) should come first
    if (a.verified === false && b.verified !== false) return -1;
    if (a.verified !== false && b.verified === false) return 1;
    
    return 0;
  });

  // Handle refresh events
  const handleRefresh = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRefreshing(true);
      await queryClient.refetchQueries();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearCategory = () => {
    setSelectedCategory('wszystkie');
  };

  return {
    // Data
    events: baseEvents,
    filteredEvents,
    categories,
    selectedCategory,
    
    // State
    refreshing,
    isFetchingEvents,
    isRefetchingEvents,
    isFetchingCategories,
    isRefetchingCategories,
    
    // Actions
    setSelectedCategory,
    handleRefresh,
    handleClearCategory,
  };
}

