export type Locale = (typeof locales)[number];

export const locales = ['pl', 'en'] as const;
export const defaultLocale: Locale = 'pl';

// Centralized configuration
export const i18nConfig = {
  COOKIE_NAME: 'locale',
  COOKIE_MAX_AGE: 60 * 60 * 24 * 365, // 1 year
} as const;
