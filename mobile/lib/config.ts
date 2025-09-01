// API Configuration
const resolveBaseUrl = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  const sanitizedEnv = fromEnv?.replace(/\/+$/u, '');
  if (sanitizedEnv) return sanitizedEnv;
  const fallback = __DEV__ ? 'http://localhost:8000' : 'https://api.pwrnow.pl';
  return fallback;
};

export const API_CONFIG = {
  VERSION: 'v1',
  BASE_URL: resolveBaseUrl(),
};

// Helper to get full API URL
export const getApiUrl = (): string => {
  return `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}`;
};

export const config = {
  shareBaseUrl:
    process.env.EXPO_PUBLIC_SITE_URL || 'https://pwrnow.pl' + '/wydarzenia',
  posthogApiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
  posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
};
