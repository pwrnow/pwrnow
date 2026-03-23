import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { detectLocaleFromHeaders } from './lib/locale-detection';
import { i18nConfig } from './i18n/config';
import { trackServerEvent } from './lib/posthog-server';

const APP_STORE_PATHS = ['/apka', '/ios', '/android', '/mobile', '/download', '/pobierz', '/wlepa'];
const IOS_STORE_URL = 'https://apps.apple.com/pl/app/pwr-now/id6751172859';
const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=pl.pwrnow.app';

function getAppStoreUrl(userAgent: string): string | null {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return IOS_STORE_URL;
  if (/Android/i.test(userAgent)) return ANDROID_STORE_URL;
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

  // Handle app store redirects
  if (APP_STORE_PATHS.includes(pathname)) {
    if (pathname === '/wlepa') {
      const forwardedFor = request.headers.get('x-forwarded-for') ||
                          request.headers.get('x-real-ip') ||
                          'unknown';
      const distinctId = `anonymous-${Buffer.from(forwardedFor + userAgent).toString('base64').slice(0, 16)}`;
      const storeUrl = getAppStoreUrl(userAgent) ?? IOS_STORE_URL;
      trackServerEvent(distinctId, 'wlepa_scanned', {
        pathname,
        user_agent: userAgent,
        ip_address: forwardedFor,
        timestamp: new Date().toISOString(),
        redirect_target: storeUrl,
      });
    }

    const storeUrl = getAppStoreUrl(userAgent);
    if (storeUrl) {
      return NextResponse.redirect(storeUrl);
    }
    return NextResponse.redirect(new URL('/aplikacja', request.url));
  }

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next();
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
