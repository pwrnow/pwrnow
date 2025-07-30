/**
 * Analytics configuration for Plausible
 */

export const analyticsConfig = {
    domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "pwrnow.pl",
    apiHost: process.env.SERVICE_FQDN_PLAUSIBLE || "https://anal.pwrnow.pl",
    enabled: process.env.NEXT_PUBLIC_PLAUSIBLE_ENABLED === "true",
    trackLocalhost: true, // Always allow localhost tracking when enabled
};

/**
 * Check if analytics should be enabled based on environment
 */
export const shouldEnableAnalytics = (): boolean => {
    return analyticsConfig.enabled;
};

/**
 * Get the appropriate domain for the current environment
 */
export const getAnalyticsDomain = (): string => {
    return analyticsConfig.domain;
};
