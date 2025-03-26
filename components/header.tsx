'use client';

import Logo from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';

interface HeaderProps {
  showLogoLink?: boolean;
}

export default function Header({ showLogoLink = false }: HeaderProps) {
  return (
    <header className='sticky top-0 z-20 w-full bg-background/95 backdrop-blur-md'>
      <div className='flex justify-between items-center p-3 sm:p-4'>
        <div className='w-10'></div> {/* Empty div for balance */}
        {showLogoLink ? (
          <Link href='/'>
            <Logo />
          </Link>
        ) : (
          <Logo />
        )}
        <div className='w-10 flex justify-end'>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
