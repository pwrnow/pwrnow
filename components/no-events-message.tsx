'use client';

import Link from 'next/link';

export default function NoEventsMessage() {
  return (
    <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-4 py-12 text-center'>
      <p className='text-muted-foreground'>Brak wydarzeń w tej kategorii.</p>
      <Link
        href='/'
        className='mt-4 inline-block text-sm text-primary hover:underline'
      >
        Wróć do wszystkich wydarzeń
      </Link>
    </div>
  );
}
