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

  // Improved check for organization pages
  // Identify organization pages by looking for paths that:
  // 1. Start with a path segment that's not empty, "zespol", or "dla-organizacji"
  // 2. Don't have special paths like "add-event" or "settings" at the beginning
  const pathSegments = pathname.split('/').filter(Boolean);
  const isOrgPage =
    pathSegments.length > 0 &&
    !['zespol', 'dla-organizacji'].includes(pathSegments[0]) &&
    !pathname.startsWith('/add-event') &&
    !pathname.startsWith('/settings');

  // Get organization code from the pathname if we're on an org page
  const orgCode = isOrgPage ? pathSegments[0] : null;

  return (
    <header className='sticky top-0 z-20 w-full bg-background/95 backdrop-blur-md'>
      <div className='flex justify-between items-center p-3 sm:p-4'>
        <div className='w-24'></div>
        {showLogoLink || isOrgPage ? (
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
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
