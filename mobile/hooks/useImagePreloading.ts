import { useEffect, useCallback } from 'react';
import { imagePreloader } from '../lib/imagePreloader';
import type { Event } from '../types';

export function useImagePreloading() {
  // Preload images when events are displayed
  const preloadEventImages = useCallback(async (events: Event[]) => {
    try {
      await imagePreloader.preloadVisibleEvents(events);
    } catch (error) {
      console.warn('Failed to preload event images:', error);
    }
  }, []);

  // Preload images for a specific event (high priority)
  const preloadSingleEvent = useCallback(async (event: Event) => {
    try {
      await imagePreloader.preloadEventImages(event);
    } catch (error) {
      console.warn('Failed to preload single event images:', error);
    }
  }, []);

  // Background preloading of upcoming events
  const preloadUpcomingEvents = useCallback(async () => {
    try {
      await imagePreloader.preloadUpcomingEvents();
    } catch (error) {
      console.warn('Failed to preload upcoming events:', error);
    }
  }, []);

  return {
    preloadEventImages,
    preloadSingleEvent,
    preloadUpcomingEvents,
  };
}
