import { Suspense } from 'react';
import EventFeed, { EventFeedSkeleton } from '@/components/event-feed';
import CategorySelector from '@/components/category-selector';
import { getEvents, Event } from '@/app/actions/events';
import { getCategories } from '@/app/actions/categories';
import { generateEventJsonLd } from '@/lib/jsonld';

// Enable Full Route Cache by setting revalidation
export const revalidate = 3600; // Revalidate every hour

// Enable static generation for better caching
export const dynamic = 'force-dynamic';

// Cache fetch requests for better performance
export const fetchCache = 'default-cache';

export default async function Home({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const categories = await getCategories();
  const params = await searchParams;
  const category = params.category;
  const events = await getEvents(category);

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

      <CategorySelector categories={categories} />

      <div className='w-full mt-4 sm:mt-6 transition-all duration-300'>
        <Suspense fallback={<EventFeedSkeleton />}>
          <EventFeed allEvents={events} categorySlug={category} />
        </Suspense>
      </div>
    </>
  );
}
