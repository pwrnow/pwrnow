// API Configuration
export const API_CONFIG = {
  VERSION: 'v1',
  BASE_URL: __DEV__ ? 'http://localhost:8000' : 'https://pwrnow.pl',
};

// Helper to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.VERSION}${endpoint}`;
};

// Share configuration
export const config = {
  shareBaseUrl: process.env.SHARE_BASE_URL || 'https://pwrnow.pl/wydarzenia',
};
