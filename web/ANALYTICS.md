# Analytics Setup - Web App

This document describes how analytics are implemented in the web app to match the mobile app for consistent cross-platform tracking.

## Setup

1. **Install PostHog** (already done):
   ```bash
   pnpm add posthog-js
   ```

2. **Add environment variables** to `.env.local`:
   ```bash
   NEXT_PUBLIC_POSTHOG_KEY=phc_your_api_key_here
   NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
   NEXT_PUBLIC_ANALYTICS_ENABLED=true  # optional, enabled by default
   ```

3. **Reverse Proxy** (already configured):
   - Events are proxied through `/ingest` → `https://eu.i.posthog.com`
   - This prevents ad-blockers from blocking analytics
   - Configured in `next.config.ts`

## Initialization

PostHog is initialized in `instrumentation-client.ts` using Next.js 15.3+ instrumentation:

- ✅ Auto-captures pageviews
- ✅ Auto-captures page leave events
- ✅ Auto-captures button clicks (autocapture)
- ✅ Captures exceptions
- ✅ Debug mode in development

## Usage

Import the `useAnalytics` hook in any client component:

```tsx
'use client';

import { useAnalytics } from '@/lib/useAnalytics';

export default function MyComponent() {
  const { trackCategorySelected, trackEventCtaClicked } = useAnalytics();

  // Use the tracking methods
}
```

## Event Names & Metadata

All event names use **snake_case** to match the mobile app. Every event automatically includes:

- `app: 'web'`
- `platform: 'desktop_web' | 'mobile_web'`
- `locale: string` (browser language)

### Core Events (Match Mobile App)

#### 1. Category Selection
```tsx
trackCategorySelected(
  categorySlug: string,
  categoryName: string,
  source: 'home' | 'feed' | 'other' = 'home'
)
```
**Event name:** `category_selected`
**Properties:**
- `category_slug`
- `category_name`
- `source`

#### 2. Event Detail Viewed
```tsx
trackEventDetailViewed(
  event: EventIdentity,
  source: 'deep_link' | 'navigation' | 'share' | 'unknown' = 'unknown'
)
```
**Event name:** `event_detail_viewed`
**Properties:** All event properties + `source`

#### 3. Event CTA Clicked
```tsx
trackEventCtaClicked(
  event: EventIdentity,
  source: 'card_cta' | 'detail_cta' = 'card_cta'
)
```
**Event name:** `event_cta_clicked`
**Properties:** All event properties + `source`

#### 4. Event Image Clicked
```tsx
trackEventImageClicked(event: EventIdentity)
```
**Event name:** `event_image_clicked`
**Properties:** All event properties

#### 5. Event Pill Clicked
```tsx
trackEventPillClicked(
  event: EventIdentity,
  pillType: 'date' | 'time' | 'location'
)
```
**Event name:** `event_pill_clicked`
**Properties:** All event properties + `pill_type`

#### 6. Event Description Toggled
```tsx
trackEventDescriptionToggled(event: EventIdentity, expanded: boolean)
```
**Event name:** `event_description_toggled`
**Properties:** All event properties + `expanded`

#### 7. Event Share Clicked
```tsx
trackEventShareClicked(event: EventIdentity)
```
**Event name:** `event_share_clicked`
**Properties:** All event properties

#### 8. Event Favorite Toggled
```tsx
trackEventFavoriteToggled(event: EventIdentity, favorited: boolean)
```
**Event name:** `event_favorite_toggled`
**Properties:** All event properties + `favorited`

### Event Properties (buildEventProps)

When tracking events, the following properties are automatically included:

- `event_id`
- `event_slug`
- `event_title`
- `event_category_slug`
- `event_category_name`
- `organization_name`
- `organization_id`
- `starts_at`
- `ends_at`
- `has_image`
- `aspect_ratio`
- `is_new`

### Web-Specific Events

#### Search
```tsx
trackSearch(query: string, resultsCount: number)
```
**Event name:** `search`
**Properties:**
- `query`
- `results_count`

#### Event Submission
```tsx
trackEventSubmission(organizationId: string, organizationName: string)
```
**Event name:** `event_submission`
**Properties:**
- `organization_id`
- `organization_name`

#### Organization View
```tsx
trackOrganizationView(
  organizationId: string,
  organizationName: string,
  organizationSlug: string
)
```
**Event name:** `organization_view`
**Properties:**
- `organization_id`
- `organization_name`
- `organization_slug`

#### Organization Events View
```tsx
trackOrganizationEventsView(
  organizationId: string,
  organizationName: string,
  eventCount: number
)
```
**Event name:** `organization_events_view`
**Properties:**
- `organization_id`
- `organization_name`
- `event_count`

#### Org Auth
```tsx
trackOrgAuth(organizationCode: string, success: boolean)
```
**Event name:** `org_auth`
**Properties:**
- `organization_code` (truncated to 10 chars)
- `success`
- `timestamp`

### Custom Events

For custom events not covered by the predefined methods:

```tsx
const { safeCapture } = useAnalytics();

safeCapture('custom_event_name', {
  property_one: 'value',
  property_two: 123,
  property_three: true,
});
```

## Debugging

In development mode, PostHog logs all events to the console:

```
[PostHog] Initialized with key: phc_XXXXXXX...
[Analytics] Tracking event: category_selected
[Analytics] ✓ Event sent to PostHog: category_selected
```

If events aren't being sent, check:
1. `.env.local` has `NEXT_PUBLIC_POSTHOG_KEY` set
2. Console shows `[PostHog] Initialized with key: ...`
3. Console shows `PostHog initialized: true` when events are tracked
4. Check PostHog dashboard after 5-10 seconds (events are batched)

## Comparison with Mobile App

The web analytics implementation matches the mobile app (`mobile/lib/analytics.ts`):

✅ Same event names (snake_case)
✅ Same property names (snake_case)
✅ Same event metadata structure
✅ Same common properties (app, platform, locale)
✅ Same event identity properties

This ensures consistent analytics data across both platforms for unified reporting.

