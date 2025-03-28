'use client';

import { useMemo } from 'react';
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
  // Use useMemo to efficiently filter events when category changes
  const filteredEvents = useMemo(() => {
    if (!categorySlug || categorySlug === 'wszystkie') {
      return allEvents;
    }

    return allEvents.filter((event) => event.category?.slug === categorySlug);
  }, [allEvents, categorySlug]);

  if (filteredEvents.length === 0) {
    return <NoEventsMessage />;
  }

  return (
    <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-0 sm:px-4'>
      <div className='flex flex-col'>
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className='opacity-100 transition-opacity duration-100'
          >
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </div>
  );
}
