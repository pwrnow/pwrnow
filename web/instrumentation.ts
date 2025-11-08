import posthog from 'posthog-js';
import * as Sentry from '@sentry/nextjs';

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (typeof window !== 'undefined' && key) {
  posthog.init(key, {
    ...(host ? { api_host: host } : {}),
    defaults: '2025-05-24',
  });
}


export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;