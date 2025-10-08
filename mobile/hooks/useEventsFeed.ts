import { useState, useEffect, useRef, useMemo } from 'react';
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
  const baseEvents = useMemo(() => {
    if (filterLiked) {
      return events.filter((event) => event.liked === true);
    }
    return events;
  }, [events, filterLiked]);

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
  const categories: Category[] = useMemo(
    () => [{ name: t('all'), slug: 'wszystkie' }, ...fetchedCategories],
    [fetchedCategories]
  );

  // Compute filtered events based on selected category
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'wszystkie') {
      return baseEvents;
    }
    return baseEvents.filter(
      (event) => event.category.slug === selectedCategory
    );
  }, [baseEvents, selectedCategory]);

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

