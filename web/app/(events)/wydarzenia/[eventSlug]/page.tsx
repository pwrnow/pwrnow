// Dynamic event detail page for SEO and sharing
// Shows a single event card for the event with the given slug
import { getEventBySlug } from '@/lib/api';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import EventCard from '@/components/event-card';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}): Promise<Metadata> {
  try {
    const { eventSlug } = await params;
    const event = await getEventBySlug(eventSlug);
    return {
      title: event.title,
      description: event.description || undefined,
      openGraph: {
        title: event.title,
        description: event.description || undefined,
        images: event.image_url ? [event.image_url] : undefined,
      },
    };
  } catch {
    return { title: 'Wydarzenie nie znalezione' };
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  let event;
  try {
    const { eventSlug } = await params;
    event = await getEventBySlug(eventSlug);
  } catch {
    return notFound();
  }
  if (!event) return notFound();
  return <EventCard event={event} />;
}
// Developer tip: To link to this page, use `/wydarzenia/[event.slug]` for any event object.
