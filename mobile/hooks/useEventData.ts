import { useState, useEffect, useMemo } from 'react';
import { useEventBySlug, useEventPosts } from '../lib/queries';
import { generateEventDays } from '../components/WeekDaySelector';
import { generateScheduleData } from '../lib/scheduleDataGenerator';

export const useEventData = (eventSlug?: string) => {
  const [selectedDay, setSelectedDay] = useState<string>('');

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

  // Initialize selected day when event days are available
  useEffect(() => {
    if (eventDays.length > 0 && !selectedDay) {
      // Try to select today if it's within the event dates, otherwise select the first day
      const todayOption = eventDays.find((day) => day.isToday);
      setSelectedDay(todayOption ? todayOption.id : eventDays[0].id);
    }
  }, [eventDays, selectedDay]);

  // Combined loading state
  const isLoading = isLoadingEvent || isLoadingPosts;

  return {
    // Data
    event,
    posts,
    eventDays,
    scheduleByDay,
    selectedDay,

    // Loading states
    isLoading,
    isLoadingEvent,
    isLoadingPosts,

    // Errors
    eventError,
    postsError,

    // Actions
    setSelectedDay,
  };
};
