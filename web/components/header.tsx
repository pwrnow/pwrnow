'use client';

import Logo from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Header() {
  return (
    <header className='sticky top-0 z-20 w-full bg-background/95 backdrop-blur-md border-b border-border/50'>
      <div className='flex justify-between items-center p-3 sm:p-4 max-w-7xl mx-auto'>
        <div className='w-24'></div>
        <Logo />
        <div className='w-24 flex justify-end items-center'>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
