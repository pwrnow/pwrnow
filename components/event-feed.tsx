'use client';

import { useCallback, useEffect, useState } from 'react';
import EventCard from './event-card';
import { EventCardSkeleton } from './event-card-skeleton';
import NoEventsMessage from './no-events-message';
import { Event } from '@/app/page';

// Server-side version of getEvents removed (will be called from page.tsx)

export function EventFeedSkeleton() {
  return (
    <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-0 sm:px-4'>
      <div className='flex flex-col'>
        {Array.from({ length: 3 }).map((_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export default function EventFeed({
  allEvents,
  categorySlug,
}: {
  allEvents: Event[];
  categorySlug?: string;
}) {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  const filterEvents = useCallback(() => {
    if (!categorySlug || categorySlug === 'wszystkie') {
      setFilteredEvents(allEvents);
      return;
    }

    const filtered = allEvents.filter(
      (event) => event.category?.slug === categorySlug
    );

    setFilteredEvents(filtered);
  }, [allEvents, categorySlug]);

  useEffect(() => {
    filterEvents();
  }, [filterEvents]);

  if (filteredEvents.length === 0) {
    return <NoEventsMessage />;
  }

  return (
    <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-0 sm:px-4'>
      <div className='flex flex-col animate-in fade-in-50 duration-500'>
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
