import posthog from 'posthog-js';
import { useCallback, useMemo } from 'react';
import { shouldEnableAnalytics } from './analytics';
import type { Event } from './types';

export interface EventProps {
  [key: string]: string | number | boolean | null | undefined;
}

type EventIdentity = Pick<
  Event,
  | 'id'
  | 'slug'
  | 'title'
  | 'starts_at'
  | 'ends_at'
  | 'image_url'
  | 'aspect_ratio'
  | 'is_new'
> & {
  category: { slug: string; name: string };
  organization: { id?: string | null; name: string };
};

const buildEventProps = (event: EventIdentity) => ({
  event_id: event.id,
  event_slug: event.slug,
  event_title: event.title,
  event_category_slug: event.category?.slug,
  event_category_name: event.category?.name,
  organization_name: event.organization?.name,
  organization_id: event.organization?.id ?? null,
  starts_at: event.starts_at,
  ends_at: event.ends_at,
  has_image: Boolean(event.image_url),
  aspect_ratio: event.aspect_ratio ?? null,
  is_new: Boolean(event.is_new),
});

/**
 * Custom hook for tracking events (PostHog-backed)
 * Matches mobile app implementation for consistent analytics
 */
export const useAnalytics = () => {
  const isEnabled = shouldEnableAnalytics();

  // Common properties added to all events (matches mobile app)
  const common = useMemo(
    () => ({
      app: 'web',
      platform: typeof navigator !== 'undefined' ?
        (navigator.userAgent.includes('Mobile') ? 'mobile_web' : 'desktop_web') : 'web',
      locale: typeof navigator !== 'undefined' ? navigator.language : 'en',
    }),
    []
  );

  const safeCapture = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      // Log in dev regardless of isEnabled
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[Analytics] Tracking event: ${eventName}`,
          { ...common, ...(properties ?? {}) },
          `| PostHog initialized: ${posthog.__loaded}`,
          `| Analytics enabled: ${isEnabled}`
        );
      }

      // If disabled, skip actual tracking but still log
      if (!isEnabled) {
        return;
      }

      // PostHog (only on client when initialized)
      if (typeof window !== 'undefined' && posthog.__loaded) {
        try {
          // Always include common properties
          posthog.capture(eventName, { ...common, ...(properties ?? {}) });
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Analytics] ✓ Event sent to PostHog: ${eventName}`);
          }
        } catch (error) {
          console.error('[Analytics] Error tracking event with PostHog:', error);
        }
      } else if (typeof window !== 'undefined') {
        console.warn('[Analytics] PostHog not initialized - event not sent:', eventName);
      }
    },
    [isEnabled, common]
  );

  // ===== Core tracking methods matching mobile app =====

  const trackCategorySelected = useCallback(
    (
      categorySlug: string,
      categoryName: string,
      source: 'home' | 'feed' | 'other' = 'home'
    ) =>
      safeCapture('category_selected', {
        category_slug: categorySlug,
        category_name: categoryName,
        source,
      }),
    [safeCapture]
  );

  const trackEventDetailViewed = useCallback(
    (
      event: EventIdentity,
      source: 'deep_link' | 'navigation' | 'share' | 'unknown' = 'unknown'
    ) =>
      safeCapture('event_detail_viewed', {
        ...buildEventProps(event),
        source,
      }),
    [safeCapture]
  );

  const trackEventCtaClicked = useCallback(
    (
      event: EventIdentity,
      source: 'card_cta' | 'detail_cta' = 'card_cta'
    ) =>
      safeCapture('event_cta_clicked', {
        ...buildEventProps(event),
        source,
      }),
    [safeCapture]
  );

  const trackEventImageClicked = useCallback(
    (event: EventIdentity) =>
      safeCapture('event_image_clicked', buildEventProps(event)),
    [safeCapture]
  );

  const trackEventPillClicked = useCallback(
    (
      event: EventIdentity,
      pillType: 'date' | 'time' | 'location'
    ) =>
      safeCapture('event_pill_clicked', {
        ...buildEventProps(event),
        pill_type: pillType,
      }),
    [safeCapture]
  );

  const trackEventDescriptionToggled = useCallback(
    (event: EventIdentity, expanded: boolean) =>
      safeCapture('event_description_toggled', {
        ...buildEventProps(event),
        expanded,
      }),
    [safeCapture]
  );

  const trackEventShareClicked = useCallback(
    (event: EventIdentity) =>
      safeCapture('event_share_clicked', buildEventProps(event)),
    [safeCapture]
  );

  const trackEventFavoriteToggled = useCallback(
    (event: EventIdentity, favorited: boolean) =>
      safeCapture('event_favorite_toggled', {
        ...buildEventProps(event),
        favorited,
      }),
    [safeCapture]
  );

  // ===== Web-specific tracking methods =====

  const trackSearch = useCallback(
    (query: string, resultsCount: number) =>
      safeCapture('search', {
        query: query,
        results_count: resultsCount,
      }),
    [safeCapture]
  );

  const trackEventSubmission = useCallback(
    (organizationId: string, organizationName: string) =>
      safeCapture('event_submission', {
        organization_id: organizationId,
        organization_name: organizationName,
      }),
    [safeCapture]
  );

  const trackOrganizationView = useCallback(
    (
      organizationId: string,
      organizationName: string,
      organizationSlug: string
    ) =>
      safeCapture('organization_view', {
        organization_id: organizationId,
        organization_name: organizationName,
        organization_slug: organizationSlug,
      }),
    [safeCapture]
  );

  const trackOrganizationEventsView = useCallback(
    (organizationId: string, organizationName: string, eventCount: number) =>
      safeCapture('organization_events_view', {
        organization_id: organizationId,
        organization_name: organizationName,
        event_count: eventCount,
      }),
    [safeCapture]
  );

  const trackOrgAuth = useCallback(
    (organizationCode: string, success: boolean) =>
      safeCapture('org_auth', {
        organization_code: organizationCode.substring(0, 10),
        success: success,
        timestamp: new Date().toISOString(),
      }),
    [safeCapture]
  );

  return {
    // Core methods matching mobile app
    trackCategorySelected,
    trackEventDetailViewed,
    trackEventCtaClicked,
    trackEventImageClicked,
    trackEventPillClicked,
    trackEventDescriptionToggled,
    trackEventShareClicked,
    trackEventFavoriteToggled,
    // Web-specific methods
    trackSearch,
    trackEventSubmission,
    trackOrganizationView,
    trackOrganizationEventsView,
    trackOrgAuth,
    // Legacy/internal
    safeCapture, // Exposed for custom events
    isEnabled,
  } as const;
};

export default useAnalytics;
