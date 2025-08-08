// API Configuration
export const API_CONFIG = {
  VERSION: 'v1',
  BASE_URL: __DEV__ ? 'https://api.pwrnow.pl' : 'https://pwrnow.pl',
};

// Helper to get full API URL
export const getApiUrl = (): string => {
  return `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}`;
};

// Share configuration
export const config = {
  shareBaseUrl: process.env.SHARE_BASE_URL || 'https://pwrnow.pl/wydarzenia',
};
