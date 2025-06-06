import { Suspense } from 'react';
import EventFeed, { EventFeedSkeleton } from '@/components/event-feed';
import CategorySelector from '@/components/category-selector';
import { CategorySelectorSkeleton } from '@/components/category-selector-skeleton';
import { getEvents } from '@/app/actions/events';
import { getCategories } from '@/app/actions/categories';
import { generateEventJsonLd } from '@/lib/jsonld';

// Enable Full Route Cache by setting revalidation
export const revalidate = 3600; // Revalidate every hour

// Force static generation
export const dynamic = 'force-static';

// Cache fetch requests for better performance
export const fetchCache = 'default-cache';

export default async function Home() {
  const categories = await getCategories();
  // Load ALL events - filtering will happen client-side
  const events = await getEvents();

  // Generate JSON-LD for all events
  const eventsJsonLd = events.map(generateEventJsonLd);

  return (
    <>
      {/* Add JSON-LD structured data */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: eventsJsonLd.map((event, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: event,
            })),
          }),
        }}
      />

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
