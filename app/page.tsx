import { Suspense } from 'react';
import EventFeed, { EventFeedSkeleton } from '@/components/event-feed';
import CategorySelector from '@/components/category-selector';
import { createClient } from '@/utils/supabase/server';

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

export default async function Home({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const categories = await getCategories();
  const category = await searchParams.category;

  return (
    <main className='min-h-screen'>
      <CategorySelector categories={categories} />

      <div className='w-full mt-4 sm:mt-6 transition-all duration-300'>
        <Suspense fallback={<EventFeedSkeleton />}>
          <EventFeed categorySlug={category} />
        </Suspense>
      </div>
    </main>
  );
}
