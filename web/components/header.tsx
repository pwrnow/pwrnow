'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import LocaleSelector from '@/components/locale-selector';
import { Locale } from '../i18n/config';

interface HeaderProps {
  currentLocale: Locale;
}

export default function Header({ currentLocale }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = useTranslations('Footer');

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className='sticky top-0 z-20 w-full bg-background/95 backdrop-blur-md border-b border-muted/50'>
      <div className='relative flex items-center justify-center p-3 sm:p-4'>
        {/* Left side - Mobile menu button or Desktop navigation */}
        <div className='absolute left-3 sm:left-4 flex items-center'>
          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className='lg:hidden p-2 rounded-md hover:bg-accent transition-colors'
            aria-label='Toggle mobile menu'
          >
            {isMobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </button>

          {/* Desktop navigation - hidden on mobile */}
          <nav className='hidden lg:flex items-center space-x-6'>
            <Link
              href='/zespol'
              className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
            >
              {t('team')}
            </Link>
            <Link
              href='/kontakt'
              className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
            >
              {t('contact')}
            </Link>
          </nav>
        </div>

        {/* Center - Logo (always perfectly centered) */}
        <Logo />

        {/* Right side - Controls */}
        <div className='absolute right-3 sm:right-4 flex items-center gap-2'>
          <LocaleSelector currentLocale={currentLocale} />
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className='lg:hidden border-t border-muted/50 bg-background/95 backdrop-blur-md'>
          <nav className='flex flex-col space-y-1 p-4'>
            <Link
              href='/zespol'
              className='px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('team')}
            </Link>
            <Link
              href='/kontakt'
              className='px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('contact')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
