import { Event } from '@/app/(main)/page';

export function generateEventJsonLd(event: Event) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.starts_at,
    endDate: event.ends_at,
    location: event.location
      ? {
          '@type': 'Place',
          name: event.location,
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Wrocław',
            addressCountry: 'PL',
          },
        }
      : undefined,
    organizer: event.organization
      ? {
          '@type': 'Organization',
          name: event.organization.name,
          image: event.organization.image_url,
        }
      : undefined,
    image: event.image_url,
    url: event.url || `https://pwrnow.pl/events/${event.id}`,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      price: '0',
      priceCurrency: 'PLN',
      validFrom: event.starts_at,
      url: event.url || `https://pwrnow.pl/events/${event.id}`,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      ratingCount: '1',
      bestRating: '5',
      worstRating: '1',
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
