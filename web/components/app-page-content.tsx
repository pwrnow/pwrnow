'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useAnalytics } from '@/lib/useAnalytics';
import { useEffect } from 'react';
import AppStoreDownload from './app-store-download';

export default function AppPageContent() {
  const t = useTranslations('AppPage');
  const locale = useLocale();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('/aplikacja', {
      locale,
      page_type: 'app_announcement',
    });
  }, [trackPageView, locale]);

  return (
    <div className='min-h-screen bg-background relative overflow-hidden'>
      {/* Minimalistic animated background elements */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        {/* Soft gradient orbs */}
        <div className='absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-drift-slow' />
        <div className='absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-drift-reverse' />
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-secondary/3 rounded-full blur-3xl animate-drift-gentle' />

        {/* Floating dots */}
        <div className='absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-primary/30 animate-float' />
        <div className='absolute top-3/4 right-1/4 w-2 h-2 rounded-full bg-accent/30 animate-float' style={{ animationDelay: '1s' }} />
        <div className='absolute top-1/2 right-1/3 w-2 h-2 rounded-full bg-secondary/30 animate-float' style={{ animationDelay: '2s' }} />
      </div>

      {/* Main content */}
      <section className='relative z-10 pt-32 pb-24 px-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-col lg:flex-row items-center gap-12 lg:gap-20'>
            {/* Text content */}
            <div className='flex-1 text-center lg:text-left space-y-8 animate-slide-up'>
              {/* Headline */}
              <div className='space-y-4'>
                <h1 className='text-5xl lg:text-7xl font-bold gradient-text leading-tight'>
                  {t('headline')}
                </h1>
                <p className='text-xl lg:text-2xl text-muted-foreground'>
                  {t('subheadline')}
                </p>
              </div>

              {/* Download buttons */}
              <div
                className='animate-slide-up'
                style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
              >
                <AppStoreDownload />
              </div>

              {/* Android notice */}
              <p
                className='text-muted-foreground text-sm lg:text-base animate-slide-up'
                style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
              >
                {t('androidComingSoon')}
              </p>
            </div>

            {/* iPhone mockup */}
            <div
              className='flex-1 flex justify-center lg:justify-end animate-slide-up animate-float-gentle'
              style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
            >
              <div className='relative w-[280px] sm:w-[320px] lg:w-[360px]'>
                <Image
                  src='/iphone-mockup.png'
                  alt={t('appScreenshot')}
                  width={360}
                  height={720}
                  className='w-full h-auto drop-shadow-2xl'
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

