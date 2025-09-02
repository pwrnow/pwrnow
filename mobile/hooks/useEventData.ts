import { useMemo } from 'react';
import {
  useEventBySlug,
  useEventPosts,
  useEventSchedule,
} from '../lib/queries';
import { generateEventDays } from '../components/WeekDaySelector';
import type { ScheduleItemDto } from '../lib/queries';

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
  const { data: schedule, isLoading: isLoadingSchedule } =
    useEventSchedule(eventSlug);

  // Generate event days from event dates
  const eventDays = useMemo(() => {
    return event ? generateEventDays(event.starts_at, event.ends_at) : [];
  }, [event?.starts_at, event?.ends_at]);

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

    for (const item of schedule.items as ScheduleItemDto[]) {
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

  // Combined loading state
  const isLoading = isLoadingEvent || isLoadingPosts || isLoadingSchedule;

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
