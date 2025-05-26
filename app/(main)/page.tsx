import { Suspense } from 'react';
import EventFeed, { EventFeedSkeleton } from '@/components/event-feed';
import CategorySelector from '@/components/category-selector';
import { getEvents } from '@/app/actions/events';
import { getCategories } from '@/app/actions/categories';
import { generateEventJsonLd } from '@/lib/jsonld';

// Define Event type to be shared across components
export interface Event {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  image_url: string | null;
  url: string | null;
  verified?: boolean;
  organization?: {
    id: string;
    name: string;
    image_url: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export const revalidate = 60;

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
