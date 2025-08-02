'use client';

import Logo from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import LocaleSelector from '@/components/locale-selector';
import { Locale } from '../i18n/config';

interface HeaderProps {
  currentLocale: Locale;
}

export default function Header({ currentLocale }: HeaderProps) {
  return (
    <header className='sticky top-0 z-20 w-full bg-background/95 backdrop-blur-md border-b border-muted/50'>
      <div className='flex justify-between items-center p-3 sm:p-4'>
        <div className='w-24'></div>
        <Logo />
        <div className='w-24 flex justify-end items-center gap-2'>
          <LocaleSelector currentLocale={currentLocale} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
