import { useMemo } from 'react';
import { useEventBySlug } from '../lib/queries';
import { generateEventDays } from '../components/WeekDaySelector';

export const useEventData = (eventSlug?: string) => {
  // Single query hook that includes posts and schedule
  const {
    data: event,
    isLoading: isLoadingEvent,
    error: eventError,
    refetch: refetchEvent,
  } = useEventBySlug(eventSlug);

  // Generate event days from event dates
  const eventDays = useMemo(() => {
    return event ? generateEventDays(event.starts_at, event.ends_at) : [];
  }, [event?.starts_at, event?.ends_at]);

  // Extract posts and schedule from event data
  const posts = event?.posts || [];
  const schedule = event?.schedule;

  // Check if schedule has any items
  const hasSchedule = useMemo(() => {
    return schedule && schedule.items && schedule.items.length > 0;
  }, [schedule]);

  // Group schedule items by day id
  const scheduleByDay = useMemo(() => {
    const grouped: Record<
      string,
      Array<{
        id: string;
        time: string;
        title: string;
        description: string | null;
        duration: string;
        endTime: string;
      }>
    > = {};

    if (!schedule || !schedule.items) return grouped;

    for (const item of schedule.items) {
      const dayId = item.date; // YYYY-MM-DD
      const time = item.start_time.slice(0, 5); // HH:MM
      const endTime = item.end_time.slice(0, 5); // HH:MM

      if (!grouped[dayId]) grouped[dayId] = [];
      grouped[dayId].push({
        id: item.id,
        time,
        title: item.title,
        description: item.description,
        duration: item.duration,
        endTime,
      });
    }

    // Sort each day's items by start time
    for (const day of Object.keys(grouped)) {
      grouped[day].sort((a, b) =>
        a.time < b.time ? -1 : a.time > b.time ? 1 : 0
      );
    }

    return grouped;
  }, [schedule]);

  return {
    // Data
    event,
    posts,
    eventDays,
    scheduleByDay,
    hasSchedule,

    // Loading states - now only one loading state since we use single query
    isLoading: isLoadingEvent,
    isLoadingEvent,

    // Errors
    eventError,

    // Actions
    refetch: refetchEvent,
  };
};
