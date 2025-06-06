'use client';

import { useSearchParams } from 'next/navigation';
import EventCard from './event-card';
import { EventCardSkeleton } from './event-card-skeleton';
import NoEventsMessage from './no-events-message';
import { Event } from '@/app/actions/events';

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

export default function EventFeed({ allEvents }: { allEvents: Event[] }) {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category') || 'wszystkie';

  // Filter events based on category client-side
  const filteredEvents =
    categorySlug === 'wszystkie'
      ? allEvents
      : allEvents.filter((event) => event.category?.slug === categorySlug);

  // Only show "No events" message if we have an active category filter that's not "wszystkie"
  if (filteredEvents.length === 0 && categorySlug !== 'wszystkie') {
    return <NoEventsMessage />;
  }

  // If no events overall, including in "wszystkie" category
  if (filteredEvents.length === 0) {
    return (
      <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-4 py-12 text-center'>
        <p className='text-muted-foreground'>
          Aktualnie brak dostępnych wydarzeń.
        </p>
      </div>
    );
  }

  return (
    <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-0 sm:px-4'>
      <div className='flex flex-col'>
        {filteredEvents.map((event, index) => (
          <div
            key={event.id}
            className='animate-in fade-in-5 slide-in-from-bottom-2'
            style={{
              animationDelay: `${index * 80}ms`,
              animationDuration: '400ms',
              animationFillMode: 'both',
            }}
          >
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </div>
  );
}
