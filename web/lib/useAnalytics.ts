import { usePlausible } from 'next-plausible';
import posthog from 'posthog-js';
import { useCallback } from 'react';
import { shouldEnableAnalytics } from './analytics';

export interface EventProps {
  [key: string]: string | number | boolean;
}

/**
 * Custom hook for tracking events with Plausible
 */
export const useAnalytics = () => {
  const plausible = usePlausible();
  const isEnabled = shouldEnableAnalytics();

  const trackEvent = useCallback(
    (eventName: string, props?: EventProps) => {
      // Plausible (controlled by isEnabled)
      if (!isEnabled) {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[Analytics] Event would be tracked (Plausible disabled): ${eventName}`,
            props
          );
        }
      } else {
        if (props) {
          plausible(eventName, { props });
        } else {
          plausible(eventName);
        }
      }

      // PostHog (independent toggle; only on client when initialized)
      if (typeof window !== 'undefined') {
        try {
          if (props) {
            posthog.capture(eventName, props as EventProps);
          } else {
            posthog.capture(eventName);
          }
        } catch (error) {
          console.error('Error tracking event with PostHog:', error);
        }
      }
    },
    [plausible, isEnabled]
  );

  const trackPageView = useCallback(
    (url?: string, props?: EventProps) => {
      if (!isEnabled) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Analytics] Pageview would be tracked: ${url}`, props);
        }
        return;
      }

      plausible('pageview', { u: url, props });
    },
    [plausible, isEnabled]
  );

  // Predefined event tracking functions
  const trackEventClick = useCallback(
    (
      eventId: string,
      eventTitle: string,
      organizationId?: string,
      organizationName?: string
    ) => {
      trackEvent('Event Click', {
        'Event ID': eventId,
        'Event Title': eventTitle,
        'Organization ID': organizationId || 'unknown',
        'Organization Name': organizationName || 'unknown',
      });
    },
    [trackEvent]
  );

  const trackCategoryFilter = useCallback(
    (category: string) => {
      trackEvent('Category Filter', {
        Category: category,
      });
    },
    [trackEvent]
  );

  const trackSearch = useCallback(
    (query: string, resultsCount: number) => {
      trackEvent('Search', {
        Query: query,
        'Results Count': resultsCount,
      });
    },
    [trackEvent]
  );

  const trackEventSubmission = useCallback(
    (organizationId: string) => {
      trackEvent('Event Submission', {
        'Organization ID': organizationId,
      });
    },
    [trackEvent]
  );

  const trackOrganizationView = useCallback(
    (
      organizationId: string,
      organizationName: string,
      organizationSlug: string
    ) => {
      trackEvent('Organization View', {
        'Organization ID': organizationId,
        'Organization Name': organizationName,
        'Organization Slug': organizationSlug,
      });
    },
    [trackEvent]
  );

  const trackOrganizationEventsView = useCallback(
    (organizationId: string, organizationName: string, eventCount: number) => {
      trackEvent('Organization Events View', {
        'Organization ID': organizationId,
        'Organization Name': organizationName,
        'Event Count': eventCount,
      });
    },
    [trackEvent]
  );

  const trackEventInteraction = useCallback(
    (
      interaction:
        | 'view'
        | 'description_expand'
        | 'map_click'
        | 'external_link',
      eventId: string,
      eventTitle: string,
      organizationId?: string,
      organizationName?: string
    ) => {
      trackEvent('Event Interaction', {
        'Interaction Type': interaction,
        'Event ID': eventId,
        'Event Title': eventTitle,
        'Organization ID': organizationId || 'unknown',
        'Organization Name': organizationName || 'unknown',
      });
    },
    [trackEvent]
  );

  const trackCategoryInteraction = useCallback(
    (categorySlug: string, categoryName: string, eventCount?: number) => {
      trackEvent('Category Interaction', {
        'Category Slug': categorySlug,
        'Category Name': categoryName,
        'Event Count': eventCount || 0,
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackPageView,
    trackEventClick,
    trackCategoryFilter,
    trackSearch,
    trackEventSubmission,
    trackOrganizationView,
    trackOrganizationEventsView,
    trackEventInteraction,
    trackCategoryInteraction,
    isEnabled,
  };
};

export default useAnalytics;
