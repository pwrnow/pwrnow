import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { locales, defaultLocale, Locale } from '../i18n/config';

/**
 * Detects the preferred locale from the Accept-Language header
 * using negotiator and intl-localematcher as recommended by Next.js docs
 */
export function detectLocaleFromHeaders(
  acceptLanguage?: string | null
): Locale {
  if (!acceptLanguage) {
    return defaultLocale;
  }

  try {
    // Parse Accept-Language header using negotiator
    const headers = { 'accept-language': acceptLanguage };
    const languages = new Negotiator({ headers }).languages();

    // Match the preferred language with our supported locales
    const detectedLocale = match(languages, locales, defaultLocale);

    return detectedLocale as Locale;
  } catch (error) {
    // Fallback to default locale if detection fails
    console.warn('Locale detection failed:', error);
    return defaultLocale;
  }
}

/**
 * Detects locale from browser navigator.language as client-side fallback
 */
export function detectLocaleFromBrowser(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  try {
    const browserLanguage = navigator.language;

    // Try to match the full locale first (e.g., 'pl-PL')
    if (locales.includes(browserLanguage as Locale)) {
      return browserLanguage as Locale;
    }

    // Try to match just the language part (e.g., 'pl' from 'pl-PL')
    const languageCode = browserLanguage.split('-')[0];
    if (locales.includes(languageCode as Locale)) {
      return languageCode as Locale;
    }

    return defaultLocale;
  } catch (error) {
    console.warn('Browser locale detection failed:', error);
    return defaultLocale;
  }
}
