import { Event } from '@/app/(main)/page';

export function generateEventJsonLd(event: Event) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: new Date(event.starts_at).toISOString(),
    endDate: new Date(event.ends_at).toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: event.location
      ? {
          '@type': 'Place',
          name: event.location,
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Wrocław',
            addressRegion: 'Dolnośląskie',
            addressCountry: 'PL',
            streetAddress: event.location,
          },
        }
      : {
          '@type': 'VirtualLocation',
          url: event.url || `https://pwrnow.pl/events/${event.id}`,
        },
    organizer: event.organization
      ? {
          '@type': 'Organization',
          name: event.organization.name,
          image: event.organization.image_url,
          url: `https://pwrnow.pl/organizations/${event.organization.id}`,
        }
      : {
          '@type': 'Organization',
          name: 'PWr Now',
          url: 'https://pwrnow.pl',
        },
    image: [event.image_url || 'https://pwrnow.pl/og-image.jpg'],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'PLN',
      validFrom: new Date(event.starts_at).toISOString(),
      url: event.url || `https://pwrnow.pl/events/${event.id}`,
      category: event.category?.name || 'Event',
      availability: 'https://schema.org/InStock',
    },
    performer: event.organization
      ? [
          {
            '@type': 'Organization',
            name: event.organization.name,
          },
        ]
      : undefined,
    isAccessibleForFree: true,
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
    },
  };
}

export function generateWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PWr Now',
    description:
      'Bądź na bieżąco z najnowszymi wydarzeniami na Politechnice Wrocławskiej',
    url: 'https://pwrnow.pl',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://pwrnow.pl/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'PWr Now',
    description: 'Centrum wydarzeń na Politechnice Wrocławskiej',
    url: 'https://pwrnow.pl',
    logo: 'https://pwrnow.pl/logo.png',
    sameAs: ['https://facebook.com/pwrnow', 'https://instagram.com/pwrnow.pl'],
  };
}
