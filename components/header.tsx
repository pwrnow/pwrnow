'use client';

import Logo from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';

interface HeaderProps {
  showLogoLink?: boolean;
}

export default function Header({ showLogoLink = false }: HeaderProps) {
  const pathname = usePathname();

  // Check if we're in an org page - any path with a structure like "/somecode" or "/somecode/add-event"
  // but excluding "/dla-organizacji" which is a specific route
  const isOrgPage =
    pathname !== '/' &&
    pathname !== '/dla-organizacji' &&
    (pathname.split('/').length === 2 || pathname.includes('/add-event'));

  // Get organization code from the pathname if we're on an org page
  const orgCode = isOrgPage ? pathname.split('/')[1] : null;

  return (
    <header className='sticky top-0 z-20 w-full bg-background/95 backdrop-blur-md'>
      <div className='flex justify-between items-center p-3 sm:p-4'>
        <div className='w-24'></div>
        {showLogoLink ? (
          <Link href='/'>
            <Logo />
          </Link>
        ) : (
          <Logo />
        )}
        <div className='w-24 flex justify-end items-center gap-2'>
          {isOrgPage && orgCode && (
            <Link href={`/${orgCode}/settings`}>
              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-1.5 text-sm'
              >
                <Settings className='h-4 w-4' />
                <span className='hidden sm:inline'>Ustawienia</span>
              </Button>
            </Link>
          )}
          {!isOrgPage && (
            <Link href='/dla-organizacji' className='hidden sm:block'>
              <Button variant='ghost' size='sm' className='text-sm'>
                Dla organizacji
              </Button>
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
