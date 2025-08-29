import { useMemo } from 'react';
import { Platform } from 'react-native';
import { usePostHog } from 'posthog-react-native';
import { deviceLocaleTag } from './i18n';
import { Event } from '../types';

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
  organization_id: (event.organization as any)?.id ?? null,
  starts_at: event.starts_at,
  ends_at: event.ends_at,
  has_image: Boolean(event.image_url),
  aspect_ratio: event.aspect_ratio ?? null,
  is_new: Boolean(event.is_new),
});

export function useAnalytics() {
  const posthog = usePostHog();

  const common = useMemo(
    () => ({
      app: 'mobile',
      platform: Platform.OS,
      locale: deviceLocaleTag,
    }),
    []
  );

  const safeCapture = (
    eventName: string,
    properties?: Record<string, unknown>
  ) => {
    // If PostHog is not configured, no-op
    if (!posthog) return;
    posthog.capture(eventName, { ...common, ...(properties ?? {}) });
  };

  return {
    trackCategorySelected: (
      categorySlug: string,
      categoryName: string,
      source: 'home' | 'feed' | 'other' = 'home'
    ) =>
      safeCapture('category_selected', {
        category_slug: categorySlug,
        category_name: categoryName,
        source,
      }),

    trackEventDetailViewed: (
      event: EventIdentity,
      source: 'deep_link' | 'navigation' | 'share' | 'unknown' = 'unknown'
    ) =>
      safeCapture('event_detail_viewed', {
        ...buildEventProps(event),
        source,
      }),

    trackEventCtaClicked: (
      event: EventIdentity,
      source: 'card_cta' | 'detail_cta' = 'card_cta'
    ) =>
      safeCapture('event_cta_clicked', {
        ...buildEventProps(event),
        source,
      }),

    trackEventImageClicked: (event: EventIdentity) =>
      safeCapture('event_image_clicked', buildEventProps(event)),

    trackEventPillClicked: (
      event: EventIdentity,
      pillType: 'date' | 'time' | 'location'
    ) =>
      safeCapture('event_pill_clicked', {
        ...buildEventProps(event),
        pill_type: pillType,
      }),

    trackEventDescriptionToggled: (event: EventIdentity, expanded: boolean) =>
      safeCapture('event_description_toggled', {
        ...buildEventProps(event),
        expanded,
      }),

    trackEventShareClicked: (event: EventIdentity) =>
      safeCapture('event_share_clicked', buildEventProps(event)),

    trackEventFavoriteToggled: (event: EventIdentity, favorited: boolean) =>
      safeCapture('event_favorite_toggled', {
        ...buildEventProps(event),
        favorited,
      }),
  } as const;
}
