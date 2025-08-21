import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { detectLocaleFromHeaders } from './lib/locale-detection';
import { i18nConfig } from './i18n/config';
import { trackServerEvent } from './lib/posthog-server';

export function middleware(request: NextRequest) {
  // Handle /wlepa redirect
  if (request.nextUrl.pathname === '/wlepa') {
    // Generate a unique identifier for the user (using IP + User-Agent hash for anonymity)
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const forwardedFor = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
    const distinctId = `anonymous-${Buffer.from(forwardedFor + userAgent).toString('base64').slice(0, 16)}`;
    
    // Track the click event
    trackServerEvent(distinctId, 'Wlepa Link Click', {
      pathname: '/wlepa',
      user_agent: userAgent,
      ip_address: forwardedFor,
      timestamp: new Date().toISOString(),
      redirect_target: '/', // Will be updated when you change the redirect target
    });

    // Redirect to home page (change this URL when you want to redirect to app store)
    const redirectUrl = new URL('/', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Skip middleware for static files and API routes
  const { pathname } = request.nextUrl;

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
