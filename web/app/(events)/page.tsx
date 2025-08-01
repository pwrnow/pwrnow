import { Suspense } from 'react';
import EventFeed, { EventFeedSkeleton } from '@/components/event-feed';
import CategorySelector from '@/components/category-selector';
import { CategorySelectorSkeleton } from '@/components/category-selector-skeleton';
import { getEvents } from '@/lib/api';
import { getCategories } from '@/lib/api';
import { generateEventsListStructuredData } from '@/lib/structured-data';
import type { Metadata } from 'next';

// Enable Full Route Cache by setting revalidation
export const revalidate = 60; // Revalidate every 1 minute

// Cache fetch requests for better performance
export const fetchCache = 'default-cache';

// Generate metadata for better SEO
export const metadata: Metadata = {
  title: 'Wydarzenia | PWrNow',
  description:
    'Odkryj najciekawsze wydarzenia w Twojej okolicy. Przeglądaj koncerty, warsztaty, konferencje i wiele więcej na PWrNow.',
  keywords: [
    'wydarzenia',
    'events',
    'koncerty',
    'warsztaty',
    'konferencje',
    'PWrNow',
  ],
  openGraph: {
    title: 'Wydarzenia | PWrNow',
    description: 'Odkryj najciekawsze wydarzenia w Twojej okolicy',
    type: 'website',
    siteName: 'PWrNow',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'PWrNow - Wydarzenia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wydarzenia | PWrNow',
    description: 'Odkryj najciekawsze wydarzenia w Twojej okolicy',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: '/',
  },
};

export default async function EventsPage() {
  const categories = await getCategories();
  const events = await getEvents();

  // Generate structured data for events listing
  const eventsListStructuredData = generateEventsListStructuredData(events);

  return (
    <>
      {/* Events List Structured Data for SEO */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventsListStructuredData),
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
