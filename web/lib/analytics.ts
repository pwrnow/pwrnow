/**
 * Analytics configuration (PostHog-centric)
 */

export const analyticsConfig = {
  enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
};

/**
 * Check if analytics should be enabled based on environment
 */
export const shouldEnableAnalytics = (): boolean => {
  return analyticsConfig.enabled;
};

// No Plausible domain anymore
