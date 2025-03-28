'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import EventCard from './event-card';
import { EventCardSkeleton } from './event-card-skeleton';
import NoEventsMessage from './no-events-message';
import { Event } from '@/app/page';
import { AnimatePresence, motion } from 'framer-motion';

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

  const [isChanging, setIsChanging] = useState(false);

  // Track category changes for animation
  useEffect(() => {
    setIsChanging(true);
    const timer = setTimeout(() => setIsChanging(false), 100);
    return () => clearTimeout(timer);
  }, [categorySlug]);

  if (filteredEvents.length === 0) {
    return <NoEventsMessage />;
  }

  return (
    <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-0 sm:px-4'>
      <AnimatePresence mode='wait'>
        <motion.div
          key={categorySlug || 'all'}
          className='flex flex-col'
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
