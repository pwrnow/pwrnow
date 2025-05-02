import type React from 'react';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Providers } from './providers';
import Header from '@/components/header';
import Footer from '@/components/footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'PWr Now',
  description:
    'Bądź na bieżąco z najnowszymi wydarzeniami na Politechnice Wrocławskiej',
  generator: 'v0.dev',
  metadataBase: new URL('https://pwrnow.pl'),
  applicationName: 'PWr Now',
  keywords: [
    'wydarzenia',
    'Politechnika Wrocławska',
    'PWr',
    'studenci',
    'Wrocław',
    'uczelnia',
  ],
  authors: [{ name: 'PWr Now Team' }],
  creator: 'PWr Now Team',
  publisher: 'PWr Now',
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
    siteName: 'PWr Now',
    title: 'PWr Now - Centrum wydarzeń na Politechnice Wrocławskiej',
    description:
      'Bądź na bieżąco z najnowszymi wydarzeniami na Politechnice Wrocławskiej',
    images: [
      {
        url: 'https://pwrnow.pl/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PWr Now - Centrum wydarzeń',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PWr Now - Centrum wydarzeń na Politechnice Wrocławskiej',
    description:
      'Bądź na bieżąco z najnowszymi wydarzeniami na Politechnice Wrocławskiej',
    images: ['https://pwrnow.pl/og-image.jpg'],
    creator: '@pwrnow',
  },
  alternates: {
    canonical: 'https://pwrnow.pl',
    languages: {
      'pl-PL': 'https://pwrnow.pl',
    },
  },
  verification: {
    google: 'google-site-verification-code', // Replace with actual verification code when available
  },
  category: 'education',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='pl' suppressHydrationWarning>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        <link
          href='https://fonts.googleapis.com/css2?family=Righteous&family=Space+Grotesk:wght@300..700&display=swap'
          rel='stylesheet'
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <div className='flex min-h-screen flex-col bg-background'>
              <Header />
              <main className='flex-grow w-full mx-auto'>{children}</main>
              <Footer />
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
