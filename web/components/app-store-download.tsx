'use client';

import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { APP_CONFIG } from '@/lib/config';

interface AppStoreDownloadProps {
  className?: string;
  showPlayStore?: boolean;
}

export default function AppStoreDownload({
  className = '',
  showPlayStore = true
}: AppStoreDownloadProps) {
  const locale = useLocale();
  const t = useTranslations('AppPage');

  // Determine which badge to use based on locale
  const appStoreBadge =
    locale === 'pl' ? '/app-store/pl-black.svg' : '/app-store/en-black.svg';
  const appStoreBadgeDark =
    locale === 'pl' ? '/app-store/pl-white.svg' : '/app-store/en-white.svg';

  const playStoreBadge =
    locale === 'pl' ? '/play-store/pl-dark.png' : '/play-store/en-dark.png';

  return (
    <div className={`flex flex-col sm:flex-row gap-4 items-center ${className}`}>
      {/* App Store button */}
      <a
        href={APP_CONFIG.IOS_APP_URL}
        target='_blank'
        rel='noopener noreferrer'
        className='group relative transition-transform hover:scale-105 duration-200 flex-shrink-0'
      >
        <Image
          src={appStoreBadge}
          alt={t('downloadOnAppStore')}
          width={160}
          height={53}
          className='dark:hidden h-[53px] w-[160px]'
        />
        <Image
          src={appStoreBadgeDark}
          alt={t('downloadOnAppStore')}
          width={160}
          height={53}
          className='hidden dark:block h-[53px] w-[160px]'
        />
      </a>

      {/* Google Play button */}
      {showPlayStore && (
        <a
          href={APP_CONFIG.ANDROID_APP_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='group relative transition-transform hover:scale-105 duration-200 flex-shrink-0'
        >
          <Image
            src={playStoreBadge}
            alt={t('downloadOnPlayStore')}
            width={160}
            height={53}
            className='h-[53px] w-[160px] object-contain'
          />
        </a>
      )}
    </div>
  );
}
