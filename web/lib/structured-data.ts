import { Event } from './types';

/**
 * Utility functions for generating structured data according to Google's guidelines
 * Based on: https://developers.google.com/search/docs/appearance/structured-data/event
 */

export interface EventStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  eventStatus: string;
  eventAttendanceMode: string;
  location?:
    | {
        '@type': string;
        name: string;
        address?: {
          '@type': string;
          addressLocality?: string;
          addressRegion?: string;
          addressCountry?: string;
          streetAddress?: string;
        };
      }
    | {
        '@type': string;
        url: string;
      };
  image?: string[];
  organizer: {
    '@type': string;
    name: string;
    url?: string;
  };
  offers?: {
    '@type': string;
    url: string;
    price?: string;
    priceCurrency?: string;
    availability: string;
    validFrom?: string;
    name?: string;
    description?: string;
  };
  url: string;
  performer?: {
    '@type': string;
    name: string;
  };
  keywords?: string;
  audience?: {
    '@type': string;
    audienceType: string;
    educationalRole: string;
  };
}

/**
 * Determines event attendance mode based on location and URL
 */
function getEventAttendanceMode(event: Event): string {
  // If event has a URL (likely online registration/ticket) but no physical location
  if (event.url && !event.location) {
    return 'https://schema.org/OnlineEventAttendanceMode';
  }

  // If event has both URL and location, it might be mixed mode
  if (event.url && event.location) {
    // Check if location contains online indicators
    const locationLower = event.location.toLowerCase();
    if (
      locationLower.includes('online') ||
      locationLower.includes('zoom') ||
      locationLower.includes('teams') ||
      locationLower.includes('virtual')
    ) {
      return 'https://schema.org/MixedEventAttendanceMode';
    }
    return 'https://schema.org/OfflineEventAttendanceMode';
  }

  // Default to offline if only physical location
  return 'https://schema.org/OfflineEventAttendanceMode';
}

/**
 * Parses location string to create structured location data
 */
function parseLocation(location: string, attendanceMode: string) {
  // If it's an online event, create VirtualLocation
  if (attendanceMode === 'https://schema.org/OnlineEventAttendanceMode') {
    return {
      '@type': 'VirtualLocation',
      url: location.includes('http') ? location : `https://${location}`,
    };
  }

  // For physical locations, try to parse address components
  const locationParts = location.split(',').map((part) => part.trim());

  if (locationParts.length >= 2) {
    // Assume format: "Venue Name, Street, City" or similar
    const [venueName, ...addressParts] = locationParts;

    return {
      '@type': 'Place',
      name: venueName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: addressParts.length > 1 ? addressParts[0] : undefined,
        addressLocality:
          addressParts.length > 1 ? addressParts[1] : addressParts[0],
        addressRegion: addressParts.length > 2 ? addressParts[2] : undefined,
        addressCountry: 'PL', // Default to Poland for this app
      },
    };
  }

  // Simple location format
  return {
    '@type': 'Place',
    name: location,
    address: {
      '@type': 'PostalAddress',
      addressLocality: location,
      addressCountry: 'PL',
    },
  };
}

/**
 * Ensures proper date format with timezone for structured data
 */
function formatDateForStructuredData(dateString: string): string {
  try {
    const date = new Date(dateString);
    // If date doesn't include timezone, assume Europe/Warsaw timezone
    if (
      !dateString.includes('T') ||
      (!dateString.includes('+') && !dateString.includes('Z'))
    ) {
      // Add Warsaw timezone offset (UTC+1 in winter, UTC+2 in summer)
      const offset = date.getTimezoneOffset();
      const sign = offset > 0 ? '-' : '+';
      const hours = Math.floor(Math.abs(offset) / 60);
      const minutes = Math.abs(offset) % 60;
      return `${dateString}${sign}${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
}

/**
 * Generates proper Event structured data for SEO according to Google guidelines
 * Based on: https://developers.google.com/search/docs/appearance/structured-data/event
 */
export function generateEventStructuredData(
  event: Event,
  siteUrl?: string
): EventStructuredData {
  const baseUrl =
    siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://pwrnow.pl';
  const eventUrl = event.url || `${baseUrl}/wydarzenia/${event.slug}`;
  const attendanceMode = getEventAttendanceMode(event);

  // Validate required fields according to Google guidelines
  if (!event.title) {
    throw new Error('Event title is required for structured data');
  }
  if (!event.starts_at) {
    throw new Error('Event start date is required for structured data');
  }
  if (!event.location && !event.url) {
    throw new Error(
      'Event must have either a physical location or online URL for structured data'
    );
  }

  const structuredData: EventStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title.trim(),
    description:
      event.description?.trim() ||
      `Wydarzenie ${event.title} organizowane przez ${event.organization.name}. ` +
        `Kategoria: ${event.category.name}. Dołącz do nas na tym wyjątkowym wydarzeniu studenckim na Politechnice Wrocławskiej.`,
    startDate: formatDateForStructuredData(event.starts_at),
    endDate: formatDateForStructuredData(event.ends_at),
    eventStatus: event.verified
      ? 'https://schema.org/EventScheduled'
      : 'https://schema.org/EventPostponed',
    eventAttendanceMode: attendanceMode,
    organizer: {
      '@type': 'Organization',
      name: event.organization.name,
      url: `${baseUrl}/org/${event.organization.slug}`,
    },
    url: eventUrl,
  };

  // Add location (required by Google)
  if (event.location) {
    structuredData.location = parseLocation(event.location, attendanceMode);
  } else if (
    event.url &&
    attendanceMode === 'https://schema.org/OnlineEventAttendanceMode'
  ) {
    // For online events without explicit location, create virtual location
    structuredData.location = {
      '@type': 'VirtualLocation',
      url: event.url,
    };
  }

  // Add high-quality image (recommended by Google)
  if (event.image_url) {
    // Ensure image URL is absolute
    const imageUrl = event.image_url.startsWith('http')
      ? event.image_url
      : `${baseUrl}${event.image_url}`;
    structuredData.image = [imageUrl];
  } else {
    // Fallback to organization logo or site default
    structuredData.image = [`${baseUrl}/og-image.png`];
  }

  // Enhanced offers information (recommended for better visibility)
  if (event.url) {
    structuredData.offers = {
      '@type': 'Offer',
      url: event.url,
      price: '0.00', // Most university events are free
      priceCurrency: 'PLN',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
      name: `Udział w wydarzeniu: ${event.title}`,
      description: 'Darmowy udział w wydarzeniu studenckim',
    };
  }

  // Add performer (recommended by Google)
  structuredData.performer = {
    '@type': 'Organization',
    name: event.organization.name,
  };

  // Add additional context for university events
  if (event.category?.name) {
    structuredData.keywords = [
      event.category.name,
      'PWr',
      'Politechnika Wrocławska',
      'wydarzenia studenckie',
      'Wrocław',
    ].join(', ');
  }

  // Add audience information for better targeting
  structuredData.audience = {
    '@type': 'EducationalAudience',
    audienceType: 'student',
    educationalRole: 'student',
  };

  return structuredData;
}

/**
 * Generates ItemList structured data for events listing pages
 */
export function generateEventsListStructuredData(
  events: Event[],
  siteUrl?: string
) {
  const baseUrl =
    siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://pwrnow.pl';

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Wydarzenia PWr - Nadchodzące Wydarzenia na Politechnice Wrocławskiej',
    description:
      'Kompletna lista aktualnych wydarzeń studenckich na Politechnice Wrocławskiej - sport, wyjazdy, imprezy, kursy, rozwój i prelekcje.',
    numberOfItems: events.length,
    url: baseUrl,
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${baseUrl}/wydarzenia/${event.slug}`,
      name: event.title,
      description:
        event.description ||
        `Wydarzenie ${event.title} organizowane przez ${event.organization.name}`,
      image: event.image_url,
    })),
  };
}

/**
 * Generates comprehensive structured data with all events as individual Event objects
 * This creates better SEO visibility according to Google's guidelines
 */
export function generateComprehensiveEventsStructuredData(
  events: Event[],
  siteUrl?: string
) {
  const baseUrl =
    siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://pwrnow.pl';

  // Filter events that have required properties for Google compliance
  const validEvents = events.filter((event) =>
    isEventValidForStructuredData(event)
  );

  // Generate individual event structured data with error handling
  const eventStructuredDataList = validEvents
    .map((event) => safeGenerateEventStructuredData(event, siteUrl))
    .filter(Boolean) as EventStructuredData[];

  return [
    // Main ItemList for the events page
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Wydarzenia PWr - Nadchodzące Wydarzenia na Politechnice Wrocławskiej',
      description:
        'Kompletna lista aktualnych wydarzeń studenckich na Politechnice Wrocławskiej - sport, wyjazdy, imprezy, kursy, rozwój i prelekcje.',
      numberOfItems: eventStructuredDataList.length,
      url: baseUrl,
      mainEntity: eventStructuredDataList,
      itemListElement: eventStructuredDataList.map((eventData, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: eventData.url,
        item: eventData,
      })),
    },
    // Individual Event objects for each event (better for Google discovery)
    ...eventStructuredDataList,
  ];
}

/**
 * Generates BreadcrumbList structured data
 */
export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>,
  siteUrl?: string
) {
  const baseUrl =
    siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://pwrnow.pl';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

/**
 * Generates WebSite structured data for the main site
 */
export function generateWebSiteStructuredData(siteUrl?: string) {
  const baseUrl =
    siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://pwrnow.pl';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PWrNow - Wydarzenia na Politechnice Wrocławskiej',
    alternateName: 'PWr Now',
    description:
      'Platforma wydarzeń studenckich na Politechnice Wrocławskiej. Znajdź wyjazdy, imprezy, kursy, wydarzenia sportowe i więcej.',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/wydarzenia?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PWrNow',
      url: baseUrl,
    },
    inLanguage: 'pl-PL',
    copyrightYear: new Date().getFullYear(),
    audience: {
      '@type': 'EducationalAudience',
      audienceType: 'student',
      educationalRole: 'student',
    },
  };
}

/**
 * Safe structured data generation with error handling
 */
export function safeGenerateEventStructuredData(
  event: Event,
  siteUrl?: string
): EventStructuredData | null {
  try {
    return generateEventStructuredData(event, siteUrl);
  } catch (error) {
    console.error(
      `Failed to generate structured data for event ${event.id}:`,
      error
    );
    return null;
  }
}

/**
 * Validates if an event has minimum required data for structured data
 */
export function isEventValidForStructuredData(event: Event): boolean {
  return !!(
    event.title &&
    event.starts_at &&
    event.organization?.name &&
    (event.location || event.url)
  );
}
