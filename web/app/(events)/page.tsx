import { Suspense } from 'react';
import EventFeed, { EventFeedSkeleton } from '@/components/event-feed';
import CategorySelector from '@/components/category-selector';
import { CategorySelectorSkeleton } from '@/components/category-selector-skeleton';
import { getEvents } from '@/lib/api';
import { getCategories } from '@/lib/api';

// Enable Full Route Cache by setting revalidation
export const revalidate = 3600; // Revalidate every hour

// Force static generation
export const dynamic = 'force-static';

// Cache fetch requests for better performance
export const fetchCache = 'default-cache';

export default async function EventsPage() {
  const categories = await getCategories();
  const events = await getEvents();

  return (
    <>
      <Suspense fallback={<CategorySelectorSkeleton />}>
        <CategorySelector categories={categories} />
      </Suspense>

      <div className='w-full mt-4 sm:mt-6 transition-all duration-300'>
        <Suspense fallback={<EventFeedSkeleton />}>
          <EventFeed allEvents={events} />
        </Suspense>
      </div>
    </>
  );
}
