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
  };
  url: string;
  performer?: {
    '@type': string;
    name: string;
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
 * Generates proper Event structured data for SEO
 */
export function generateEventStructuredData(
  event: Event,
  siteUrl?: string
): EventStructuredData {
  const baseUrl =
    siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://pwrnow.pl';
  const eventUrl = event.url || `${baseUrl}/wydarzenia/${event.slug}`;
  const attendanceMode = getEventAttendanceMode(event);

  const structuredData: EventStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description:
      event.description ||
      `Wydarzenie ${event.title} organizowane przez ${event.organization.name}. ` +
        `Kategoria: ${event.category.name}.`,
    startDate: event.starts_at,
    endDate: event.ends_at,
    eventStatus: event.verified
      ? 'https://schema.org/EventScheduled'
      : 'https://schema.org/EventPostponed',
    eventAttendanceMode: attendanceMode,
    organizer: {
      '@type': 'Organization',
      name: event.organization.name,
      url: event.organization.image_url
        ? `${baseUrl}/org/${event.organization.slug}`
        : undefined,
    },
    url: eventUrl,
  };

  // Add location if available
  if (event.location) {
    structuredData.location = parseLocation(event.location, attendanceMode);
  }

  // Add image if available
  if (event.image_url) {
    structuredData.image = [event.image_url];
  }

  // Add offers if event has URL (likely for tickets/registration)
  if (event.url) {
    structuredData.offers = {
      '@type': 'Offer',
      url: event.url,
      price: '0', // Default to free, can be enhanced based on event data
      priceCurrency: 'PLN',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
    };
  }

  // Add performer (organization as performer for events)
  structuredData.performer = {
    '@type': 'Organization',
    name: event.organization.name,
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
    name: 'Wydarzenia',
    description: 'Lista nadchodzących wydarzeń',
    numberOfItems: events.length,
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${baseUrl}/wydarzenia/${event.slug}`,
      name: event.title,
      description: event.description || `Wydarzenie ${event.title}`,
      image: event.image_url,
    })),
  };
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
