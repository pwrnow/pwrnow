import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { detectLocaleFromHeaders } from './lib/locale-detection';
import { i18nConfig } from './i18n/config';

export function middleware(request: NextRequest) {
  // Skip middleware for static files and API routes
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next();
  }

  // Handle /wlepa redirect - redirect to home page for now
  // TODO: In the future, redirect to appropriate app store (Google Play Store or Apple App Store)
  if (pathname === '/wlepa') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check if the user has a locale preference in cookies
  const localeFromCookie = request.cookies.get(i18nConfig.COOKIE_NAME)?.value;

  if (localeFromCookie) {
    // User has a preference, continue with the request
    return NextResponse.next();
  }

  // No locale preference set, detect from Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  const detectedLocale = detectLocaleFromHeaders(acceptLanguage);

  // Set the detected locale in a cookie for future requests
  const response = NextResponse.next();
  response.cookies.set(i18nConfig.COOKIE_NAME, detectedLocale, {
    maxAge: i18nConfig.COOKIE_MAX_AGE,
    httpOnly: false, // Allow client-side access for the locale selector
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  // Match all paths except static files
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next).*)',
    // Optional: only run on root (/) URL
    // '/'
  ],
};
