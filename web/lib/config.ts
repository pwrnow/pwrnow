// API Configuration
export const API_CONFIG = {
  VERSION: 'v1',
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
};

// Contact Configuration
export const CONTACT_CONFIG = {
  EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@pwrnow.pl',
};

// Social Media Links
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://www.facebook.com/pwrnow',
  INSTAGRAM: 'https://www.instagram.com/pwr_now/',
  MESSENGER: 'https://m.me/pwrnow',
  TIKTOK: 'https://www.tiktok.com/@pwrnow', // Not for contact
  LINKEDIN: 'https://www.linkedin.com/company/pwrnow',
};

// Helper to get full API URL
export const getApiUrl = (): string => {
  return `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}`;
};
