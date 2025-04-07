import { Suspense } from 'react';
import EventFeed, { EventFeedSkeleton } from '@/components/event-feed';
import CategorySelector from '@/components/category-selector';
import { getEvents } from './actions/events';
import { getCategories } from './actions/categories';

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

// Add cache control for revalidation (one hour)
export const revalidate = 3600; // 60 * 60 seconds = 1 hour

export default async function Home({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const categories = await getCategories();
  const params = await searchParams;
  const category = params.category;
  const events = await getEvents(category);

  return (
    <main className='min-h-screen'>
      <CategorySelector categories={categories} />

      <div className='w-full mt-4 sm:mt-6 transition-all duration-300'>
        <Suspense fallback={<EventFeedSkeleton />}>
          <EventFeed allEvents={events} categorySlug={category} />
        </Suspense>
      </div>
    </main>
  );
}
