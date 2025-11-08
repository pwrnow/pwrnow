import posthog from "posthog-js"
import * as Sentry from "@sentry/nextjs";

// Initialize PostHog only if API key is provided
if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: '2025-05-24',
    capture_pageview: true, // Auto capture pageviews
    capture_pageleave: true, // Auto capture page leave events
    autocapture: true, // Enable autocapture for button clicks etc
    capture_exceptions: true, // This enables capturing exceptions using Error Tracking
    debug: process.env.NODE_ENV === "development",
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[PostHog] Initialized with key:", process.env.NEXT_PUBLIC_POSTHOG_KEY?.substring(0, 10) + "...");
  }
} else {
  console.warn("[PostHog] Not initialized - NEXT_PUBLIC_POSTHOG_KEY is missing");
}

// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/


Sentry.init({
  dsn: "https://fbc4ab149eed77d287640b3a8bd93f70@o4510227015729152.ingest.de.sentry.io/4510227082510416",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Disable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;