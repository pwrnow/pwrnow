import EventCard from './event-card';
import { createClient } from '@/utils/supabase/server';

export async function getEvents(categorySlug?: string) {
  const supabase = await createClient();

  // First, handle the category filter
  let categoryId;
  if (categorySlug && categorySlug !== 'wszystkie') {
    // Get the category ID first
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    categoryId = category?.id;
  }

  // Then build the main query
  let query = supabase
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

  // Apply category filter if we have a category ID
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data: events, error } = await query;

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return events;
}

export default async function EventFeed({
  categorySlug,
}: {
  categorySlug?: string;
}) {
  const events = await getEvents(categorySlug);

  if (events.length === 0) {
    return (
      <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-4 py-12 text-center'>
        <p className='text-muted-foreground'>Brak wydarzeń w tej kategorii.</p>
      </div>
    );
  }

  return (
    <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-0 sm:px-4'>
      <div className='flex flex-col'>
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
