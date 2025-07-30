'use client';

import Logo from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  return (
    <header className='sticky top-0 z-20 w-full bg-background/95 backdrop-blur-md'>
      <div className='flex justify-between items-center p-3 sm:p-4'>
        <div className='w-24'></div>
        <Logo />
        <div className='w-24 flex justify-end items-center gap-2'>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
