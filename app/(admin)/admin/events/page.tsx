import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { EventsTable } from '@/app/(admin)/admin/events/events-table';

interface Event {
  id: string;
  starts_at: string;
  ends_at: string;
  title: string;
  description: string | null;
  image_url: string | null;
  location: string | null;
  verified: boolean;
  url: string | null;
  category_id: string | null;
  organization_id: string | null;
  category: Category | null;
  organization: Organization | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  order_index: number | null;
}

interface Organization {
  id: string;
  name: string;
  image_url: string | null;
  code: string | null;
}

export default async function EventsPage() {
  const supabase = await createClient();

  // Fetch events with related data
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select(
      `
      *,
      category:categories(*),
      organization:organizations(*)
    `
    )
    .order('starts_at', { ascending: false });

  // Fetch categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true });

  if (eventsError) {
    console.error('Error fetching events:', eventsError);
    return <div>Error loading events. Please try again later.</div>;
  }

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    return <div>Error loading categories. Please try again later.</div>;
  }

  return (
    <>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Wydarzenia</h1>
        <p className='text-muted-foreground'>
          Zarządzaj wydarzeniami i ich weryfikacją
        </p>
      </div>

      <EventsTable events={events || []} categories={categories || []} />
    </>
  );
}
