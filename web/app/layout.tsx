import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Space_Grotesk, Righteous } from 'next/font/google';
import './globals.css';

import PlausibleProvider from 'next-plausible';
import {
  shouldEnableAnalytics,
  getAnalyticsDomain,
  analyticsConfig,
} from '@/lib/analytics';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
});

const righteous = Righteous({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-righteous',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Layout');

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL('https://pwrnow.pl'),
    applicationName: t('applicationName'),
    keywords: [
      t('keywords.events'),
      t('keywords.politechnikaWroclawska'),
      t('keywords.pwr'),
      t('keywords.students'),
      t('keywords.wroclaw'),
      t('keywords.university'),
    ],
    authors: [{ name: t('teamName') }],
    creator: t('teamName'),
    publisher: t('publisher'),
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'pl_PL',
      url: 'https://pwrnow.pl',
      siteName: t('siteName'),
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
    category: 'education',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const enableAnalytics = shouldEnableAnalytics();
  const analyticsDomain = getAnalyticsDomain();
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${righteous.variable}`}
      >
        <NextIntlClientProvider>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            {enableAnalytics ? (
              <PlausibleProvider
                domain={analyticsDomain}
                customDomain={analyticsConfig.apiHost}
                trackLocalhost={analyticsConfig.trackLocalhost}
                enabled={enableAnalytics}
              >
                {children}
              </PlausibleProvider>
            ) : (
              children
            )}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
