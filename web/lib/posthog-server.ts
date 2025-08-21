import { PostHog } from 'posthog-node';

let posthogServer: PostHog | null = null;

/**
 * Initialize PostHog server instance
 */
function getPostHogServer(): PostHog | null {
  if (!posthogServer) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!key) {
      console.warn('PostHog key not found in environment variables');
      return null;
    }

    posthogServer = new PostHog(key, {
      host: host || 'https://app.posthog.com',
    });
  }

  return posthogServer;
}

/**
 * Track an event on the server side
 */
export function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>
): void {
  const posthog = getPostHogServer();
  
  if (!posthog) {
    console.warn('PostHog not initialized, skipping server-side event tracking');
    return;
  }

  try {
    posthog.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        $lib: 'posthog-node',
        server_side: true,
      },
    });
  } catch (error) {
    console.error('Error tracking server-side event:', error);
  }
}

/**
 * Shut down PostHog instance (useful for cleanup)
 */
export function shutdownPostHog(): Promise<void> {
  if (posthogServer) {
    return posthogServer.shutdown();
  }
  return Promise.resolve();
}
