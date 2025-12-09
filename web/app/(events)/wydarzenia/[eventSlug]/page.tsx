// Dynamic event detail page for SEO and sharing
// Shows a single event card for the event with the given slug
import { getEventBySlug, getEvents } from '@/lib/api';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import EventCard from '@/components/event-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  generateEventStructuredData,
  generateBreadcrumbStructuredData,
} from '@/lib/structured-data';
import { getTranslations, getLocale } from 'next-intl/server';
import { formatLocalizedDate } from '@/lib/utils';
import { isUpcoming } from '@/lib/organization-utils';
import { APP_CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

// Cache fetch requests for better performance
// export const fetchCache = 'default-cache';

// Generate static params for all events at build time
// export async function generateStaticParams() {
//   try {
//     const events = await getEvents();

//     return events.map((event) => ({
//       eventSlug: event.slug,
//     }));
//   } catch (error) {
//     console.error('Failed to generate static params:', error);
//     // Return empty array on error to prevent build failure
//     return [];
//   }
// }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}): Promise<Metadata> {
  try {
    const { eventSlug } = await params;
    const event = await getEventBySlug(eventSlug);
    const t = await getTranslations('EventDetailPage');
    const locale = await getLocale();

    const formattedDate = formatLocalizedDate(
      event.starts_at,
      'd MMMM yyyy',
      locale
    );

    return {
      title: `${event.title} | ${formattedDate}`,
      description:
        event.description ||
        t('defaultDescription', {
          title: event.title,
          organization: event.organization.name,
          date: formattedDate,
          location: event.location || '',
        }),
      keywords: [
        event.title,
        event.organization.name,
        event.category.name,
        t('keywords.event'),
        t('keywords.eventKeyword'),
        ...(event.location ? [event.location] : []),
      ],
      openGraph: {
        type: 'article',
        title: event.title,
        description: event.description
          ? event.description.slice(0, 160) +
            (event.description.length > 160 ? '...' : '')
          : t('ogDescription', { title: event.title, date: formattedDate }),
        images: event.image_url
          ? [
              {
                url: event.image_url,
                width: 1200,
                height: 630,
                alt: event.title,
              },
            ]
          : undefined,
        siteName: 'PwrNow',
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description: event.description
          ? event.description.slice(0, 160) +
            (event.description.length > 160 ? '...' : '')
          : t('ogDescription', { title: event.title, date: formattedDate }),
        images: event.image_url ? [event.image_url] : undefined,
      },
      alternates: {
        canonical: `/wydarzenia/${event.slug}`,
      },
      other: {
        'apple-itunes-app': `app-id=${APP_CONFIG.APP_STORE_ID}, app-argument=https://pwrnow.pl/wydarzenia/${event.slug}`,
      },
    };
  } catch {
    const t = await getTranslations('EventDetailPage');
    return {
      title: t('notFoundTitle'),
      description: t('notFoundDescription'),
    };
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

  const t = await getTranslations('EventDetailPage');

  // Generate structured data for SEO using utility function
  const structuredData = generateEventStructuredData(event);

  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'PWrNow', url: '/' },
    { name: 'Wydarzenia', url: '/' },
    { name: event.title, url: `/wydarzenia/${event.slug}` },
  ]);

  return (
    <>
      {/* Event Structured Data for SEO */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      {/* Breadcrumb Structured Data for SEO */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />

      {/* Navigation */}
      <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-4 mb-4'>
        <Link href='/'>
          <Button variant='ghost' size='sm' className='gap-2'>
            <ArrowLeft className='h-4 w-4' />
            {t('backToEvents')}
          </Button>
        </Link>
      </div>

      {/* Event Details */}
      <EventCard event={event} />
    </>
  );
}
