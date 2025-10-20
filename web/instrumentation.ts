import posthog from 'posthog-js';

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (typeof window !== 'undefined' && key) {
  posthog.init(key, {
    ...(host ? { api_host: host } : {}),
    defaults: '2025-05-24',
    autocapture: {
      url_allowlist: [
        // Allow all URLs except /auth paths
        /^(?!.*\/auth).*$/
      ],
    }
  });
}
