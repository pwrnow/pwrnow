import { useMemo } from 'react';
import { useEventBySlug, useEventPosts } from '../lib/queries';
import { generateEventDays } from '../components/WeekDaySelector';
import { generateScheduleData } from '../lib/scheduleDataGenerator';

export const useEventData = (eventSlug?: string) => {
  // Query hooks
  const {
    data: event,
    isLoading: isLoadingEvent,
    error: eventError,
  } = useEventBySlug(eventSlug);
  const {
    data: posts,
    isLoading: isLoadingPosts,
    error: postsError,
  } = useEventPosts(eventSlug);

  // Generate event days from event dates
  const eventDays = useMemo(() => {
    return event ? generateEventDays(event.starts_at, event.ends_at) : [];
  }, [event?.starts_at, event?.ends_at]);

  // Generate schedule data based on actual event days
  const scheduleByDay = useMemo(() => {
    return generateScheduleData(eventDays);
  }, [eventDays]);

  // Combined loading state
  const isLoading = isLoadingEvent || isLoadingPosts;

  return {
    // Data
    event,
    posts,
    eventDays,
    scheduleByDay,

    // Loading states
    isLoading,
    isLoadingEvent,
    isLoadingPosts,

    // Errors
    eventError,
    postsError,
  };
};
