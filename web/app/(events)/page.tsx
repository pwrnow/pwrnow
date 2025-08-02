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
import { getTranslations } from 'next-intl/server';

// Enable Full Route Cache by setting revalidation
export const revalidate = 60; // Revalidate every 1 minute

// Cache fetch requests for better performance
// export const fetchCache = 'default-cache';

// Generate metadata for better SEO
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('EventsPage');

  return {
    title: t('title'),
    description: t('description'),
    keywords: [
      t('keywords.findEvents'),
      t('keywords.currentEvents'),
      t('keywords.studentEvents'),
      t('keywords.sport'),
      t('keywords.trips'),
      t('keywords.parties'),
      t('keywords.courses'),
      t('keywords.personalDevelopment'),
      t('keywords.lectures'),
      t('keywords.eventCalendar'),
      t('keywords.whatsHappening'),
      t('keywords.pwrNowEvents'),
      t('keywords.wroclawStudentEvents'),
      t('keywords.studentLife'),
      t('keywords.discoverEvents'),
    ],
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      siteName: 'PWrNow',
      images: [
        {
          url: '/og-image.svg',
          width: 1200,
          height: 630,
          alt: t('ogImageAlt'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/og-image.svg'],
    },
    alternates: {
      canonical: '/',
    },
  };
}

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
