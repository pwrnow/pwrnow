import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AppPageContent from '@/components/app-page-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('AppPage');

  const title = t('title');
  const description = t('description');
  const url = 'https://pwrnow.pl/aplikacja';
  const ogImage = '/og-image.png';

  return {
    title,
    description,
    keywords: [
      t('keywords.mobileApp'),
      t('keywords.iosApp'),
      t('keywords.androidApp'),
      t('keywords.appStore'),
      t('keywords.playStore'),
      t('keywords.pwrApp'),
      t('keywords.studentApp'),
      t('keywords.eventsApp'),
    ],
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function AppPage() {
  return <AppPageContent />;
}

