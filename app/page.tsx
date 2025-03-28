import { Suspense } from 'react';
import EventFeed, { EventFeedSkeleton } from '@/components/event-feed';
import CategorySelector from '@/components/category-selector';
import { createClient } from '@/utils/supabase/server';

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

async function getCategories() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return categories;
}

async function getAllEvents(): Promise<Event[]> {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from('events')
    .select(
      `
      *,
      organization:organizations(*),
      category:categories(*)
    `
    )
    .gte('ends_at', new Date().toISOString())
    .eq('verified', true)
    .order('starts_at', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return events || [];
}

export default async function Home({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  // Load all data on server-side
  const [categories, events] = await Promise.all([
    getCategories(),
    getAllEvents(),
  ]);

  const categoryParam = searchParams.category;

  return (
    <main className='min-h-screen'>
      <CategorySelector categories={categories} />

      <div className='w-full mt-4 sm:mt-6 transition-all duration-300'>
        <Suspense fallback={<EventFeedSkeleton />}>
          <EventFeed allEvents={events} categorySlug={categoryParam} />
        </Suspense>
      </div>
    </main>
  );
}
