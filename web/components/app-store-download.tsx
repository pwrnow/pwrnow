'use client';

import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { APP_CONFIG } from '@/lib/config';

interface AppStoreDownloadProps {
  className?: string;
  showComingSoon?: boolean;
}

export default function AppStoreDownload({
  className = '',
  showComingSoon = true
}: AppStoreDownloadProps) {
  const locale = useLocale();
  const t = useTranslations('AppPage');

  // Determine which badge to use based on locale
  const appStoreBadge =
    locale === 'pl' ? '/app-store/pl-black.svg' : '/app-store/en-black.svg';
  const appStoreBadgeDark =
    locale === 'pl' ? '/app-store/pl-white.svg' : '/app-store/en-white.svg';

  return (
    <div className={`flex flex-col sm:flex-row gap-6 items-center justify-center ${className}`}>
      {/* App Store button */}
      <a
        href={APP_CONFIG.IOS_APP_URL}
        target='_blank'
        rel='noopener noreferrer'
        className='group relative transition-transform hover:scale-105 duration-200'
      >
        <Image
          src={appStoreBadge}
          alt={t('downloadOnAppStore')}
          width={160}
          height={53}
          className='dark:hidden'
        />
        <Image
          src={appStoreBadgeDark}
          alt={t('downloadOnAppStore')}
          width={160}
          height={53}
          className='hidden dark:block'
        />
      </a>

      {/* Google Play coming soon - only show if requested */}
      {showComingSoon && (
        <div className='relative'>
          <div className='opacity-50 grayscale pointer-events-none'>
            <div className='w-[160px] h-[53px] rounded-lg bg-muted border border-border flex items-center justify-center'>
              <span className='text-sm font-semibold text-muted-foreground'>
                Google Play
              </span>
            </div>
          </div>
          <div className='absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-md'>
            {t('comingSoon')}
          </div>
        </div>
      )}
    </div>
  );
}
