'use server';

import { cookies, headers } from 'next/headers';
import { Locale, i18nConfig } from '../i18n/config';
import { detectLocaleFromHeaders } from './locale-detection';

export async function getUserLocale(): Promise<Locale> {
  // First, check if we have a stored locale preference in cookies
  const cookieStore = await cookies();
  const storedLocale = cookieStore.get(i18nConfig.COOKIE_NAME)?.value;

  if (storedLocale) {
    return storedLocale as Locale;
  }

  // If no stored preference, detect from Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');

  return detectLocaleFromHeaders(acceptLanguage);
}

export async function setUserLocale(locale: Locale) {
  (await cookies()).set(i18nConfig.COOKIE_NAME, locale);
}
