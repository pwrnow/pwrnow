'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useAnalytics } from '@/lib/useAnalytics';
import { useEffect } from 'react';
import AppStoreDownload from './app-store-download';

export default function AppPageContent() {
  const t = useTranslations('AppPage');
  const locale = useLocale();
  const { safeCapture } = useAnalytics();

  useEffect(() => {
    // Track custom page view (PostHog auto-captures pageviews via defaults: '2025-05-24')
    safeCapture('app_page_viewed', {
      locale,
      page_type: 'app_announcement',
      page_path: '/aplikacja',
    });
  }, [safeCapture, locale]);

  return (
    <div className='relative h-screen w-full overflow-hidden bg-background'>
      {/* Background gradient orbs */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-drift-slow' />
        <div className='absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl animate-drift-reverse' />
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-3xl animate-drift-gentle' />
      </div>

      {/* Main content container */}
      <div className='relative z-10 h-full w-full flex items-center justify-center px-4 sm:px-6 lg:px-8'>
        <div className='w-full max-w-[1800px] mx-auto'>
          <div className='grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-12 xl:gap-16 items-center h-full'>

            {/* Left side - Text content */}
            <div className='flex flex-col justify-center space-y-6 lg:space-y-8 xl:space-y-10 text-center lg:text-left lg:pl-8 xl:pl-12'>
              <div
                className='space-y-4 lg:space-y-5 animate-slide-up opacity-0'
                style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
              >
                <h1 className='text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1]'>
                  <span className='gradient-text'>{t('headline')}</span>
                </h1>
                <p className='text-xl sm:text-2xl lg:text-3xl text-muted-foreground font-light max-w-2xl mx-auto lg:mx-0'>
                  {t('subheadline')}
                </p>
              </div>

              <div
                className='space-y-5 lg:space-y-6 animate-slide-up opacity-0'
                style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
              >
                <div className='inline-block'>
                  <p className='text-base sm:text-lg lg:text-xl text-muted-foreground/90 font-medium px-4 py-2 rounded-full bg-primary/5 border border-primary/10'>
                    {t('bothAppsAvailable')}
                  </p>
                </div>

                <AppStoreDownload className='justify-center lg:justify-start' />
              </div>
            </div>

            {/* Right side - Phone mockups */}
            <div
              className='relative flex items-center justify-center lg:justify-end animate-slide-up opacity-0'
              style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
            >
              <div className='relative w-full max-w-[700px] lg:max-w-[800px]'>
                <div className='relative w-full' style={{ paddingBottom: '120%' }}>
                  {/* Android phone - left/back */}
                  <div className='absolute left-0 top-0 w-[52%] z-10'>
                    <Image
                      src='/android-light-mockup.png'
                      alt={t('androidScreenshot')}
                      width={400}
                      height={800}
                      className='w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
                      priority
                    />
                  </div>

                  {/* iPhone - right/front */}
                  <div className='absolute right-0 top-0 w-[52%] z-20'>
                    <Image
                      src='/iphone-mockup.png'
                      alt={t('iosScreenshot')}
                      width={400}
                      height={800}
                      className='w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

