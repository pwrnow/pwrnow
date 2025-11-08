/**
 * Analytics configuration (PostHog-centric)
 */

export const analyticsConfig = {
  // Enable analytics by default, disable only if explicitly set to 'false'
  enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false',
};

/**
 * Check if analytics should be enabled based on environment
 */
export const shouldEnableAnalytics = (): boolean => {
  // Always enable in production, respect env var in development
  if (process.env.NODE_ENV === 'production') {
    return true;
  }
  return analyticsConfig.enabled;
};
