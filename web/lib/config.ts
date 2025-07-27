// API Configuration
export const API_CONFIG = {
  VERSION: 'v1',
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
};

// Helper to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.VERSION}${endpoint}`;
};
