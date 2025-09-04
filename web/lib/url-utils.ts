/**
 * Utility functions for generating URLs in the application
 */

/**
 * Creates a public event URL that can be shared externally
 * @param eventSlug - The event's slug identifier
 * @param baseUrl - Optional base URL, defaults to current origin
 * @returns The complete public event URL
 */
export function createEventPublicUrl(
  eventSlug: string,
  baseUrl?: string
): string {
  const origin =
    baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}/wydarzenia/${eventSlug}`;
}

/**
 * Creates an organization-specific event URL for internal navigation
 * @param orgSlug - The organization's slug identifier
 * @param eventSlug - The event's slug identifier
 * @param baseUrl - Optional base URL, defaults to current origin
 * @returns The complete organization event URL
 */
export function createOrgEventUrl(
  orgSlug: string,
  eventSlug: string,
  baseUrl?: string
): string {
  const origin =
    baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}/org/${orgSlug}/events/${eventSlug}`;
}

/**
 * Creates an organization URL
 * @param orgSlug - The organization's slug identifier
 * @param baseUrl - Optional base URL, defaults to current origin
 * @returns The complete organization URL
 */
export function createOrgUrl(orgSlug: string, baseUrl?: string): string {
  const origin =
    baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}/org/${orgSlug}`;
}

/**
 * Extracts the domain from a URL or returns the current domain
 * @param url - Optional URL to extract domain from
 * @returns The domain string
 */
export function getCurrentDomain(url?: string): string {
  if (url) {
    try {
      return new URL(url).origin;
    } catch {
      return typeof window !== 'undefined' ? window.location.origin : '';
    }
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
}
