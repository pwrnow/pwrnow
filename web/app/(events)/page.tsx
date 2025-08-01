import { Suspense } from 'react';
import EventFeed, { EventFeedSkeleton } from '@/components/event-feed';
import CategorySelector from '@/components/category-selector';
import { CategorySelectorSkeleton } from '@/components/category-selector-skeleton';
import { getEvents } from '@/lib/api';
import { getCategories } from '@/lib/api';
import {
  generateComprehensiveEventsStructuredData,
  generateWebSiteStructuredData,
} from '@/lib/structured-data';
import type { Metadata } from 'next';

// Enable Full Route Cache by setting revalidation
export const revalidate = 60; // Revalidate every 1 minute

// Cache fetch requests for better performance
export const fetchCache = 'default-cache';

// Generate metadata for better SEO
export const metadata: Metadata = {
  title: 'Twoje Wydarzenia na PWr - Wyjazdy, Imprezy, Kursy i Więcej!',
  description:
    'Znajdź i odkryj najciekawsze wydarzenia na Politechnice Wrocławskiej już dziś! Sport, wyjazdy, imprezy, kursy, rozwój i prelekcje czekają na Ciebie.',
  keywords: [
    'znajdź wydarzenia PWr',
    'aktualne wydarzenia Politechnika Wrocławska',
    'wydarzenia studenckie dziś',
    'sport PWr',
    'wyjazdy studenckie PWr',
    'imprezy PWr',
    'kursy PWr',
    'rozwój osobisty PWr',
    'prelekcje PWr',
    'kalendarz wydarzeń PWr',
    'co dzieje się na PWr',
    'PWrNow wydarzenia',
    'Wrocław wydarzenia studenckie',
    'życie studenckie PWr dziś',
    'odkryj wydarzenia PWr',
  ],
  openGraph: {
    title: 'Twoje Wydarzenia na PWr - Wyjazdy, Imprezy, Kursy i Więcej!',
    description:
      'Znajdź i odkryj najciekawsze wydarzenia na Politechnice Wrocławskiej już dziś! Sport, wyjazdy, imprezy, kursy, rozwój i prelekcje czekają na Ciebie.',
    type: 'website',
    siteName: 'PWrNow',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'PWrNow - Wydarzenia na Politechnice Wrocławskiej',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Twoje Wydarzenia na PWr - Wyjazdy, Imprezy, Kursy i Więcej!',
    description:
      'Znajdź i odkryj najciekawsze wydarzenia na Politechnice Wrocławskiej już dziś! Sport, wyjazdy, imprezy, kursy, rozwój i prelekcje czekają na Ciebie.',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: '/',
  },
};

export default async function EventsPage() {
  const categories = await getCategories();
  const events = await getEvents();

  // Generate comprehensive structured data for better SEO visibility
  const comprehensiveStructuredData =
    generateComprehensiveEventsStructuredData(events);
  const webSiteStructuredData = generateWebSiteStructuredData();

  return (
    <>
      {/* Website Structured Data for Site-level SEO */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webSiteStructuredData),
        }}
      />

      {/* Comprehensive Events Structured Data for SEO */}
      {comprehensiveStructuredData.map((structuredData, index) => (
        <script
          key={`structured-data-${index}`}
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      ))}

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
