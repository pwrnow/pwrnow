'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setUserLocale } from '@/lib/locale';
import { Locale, locales, i18nConfig } from '../i18n/config';
import { detectLocaleFromBrowser } from '../lib/locale-detection';
import { useRouter } from 'next/navigation';
import { useTransition, useEffect } from 'react';

const localeNames = {
  en: 'English',
  pl: 'Polski',
} as const;

const localeFlags = {
  en: '🇺🇸',
  pl: '🇵🇱',
} as const;

interface LocaleSelectorProps {
  currentLocale: Locale;
}

export default function LocaleSelector({ currentLocale }: LocaleSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Client-side locale detection fallback
  useEffect(() => {
    // Only run if no locale is set or if we're using the default
    const storedLocale = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${i18nConfig.COOKIE_NAME}=`))
      ?.split('=')[1];

    if (!storedLocale) {
      const browserLocale = detectLocaleFromBrowser();
      if (browserLocale !== currentLocale) {
        startTransition(async () => {
          await setUserLocale(browserLocale);
          router.refresh();
        });
      }
    }
  }, [currentLocale, router]);

  function handleLocaleChange(locale: Locale) {
    startTransition(async () => {
      await setUserLocale(locale);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          disabled={isPending}
          className='w-auto px-2'
        >
          <span className='text-lg'>{localeFlags[currentLocale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={currentLocale === locale ? 'bg-muted' : ''}
          >
            <span className='mr-2'>{localeFlags[locale]}</span>
            {localeNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
