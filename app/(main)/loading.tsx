import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className='min-h-screen'>
      {/* Header Skeleton */}
      <header className='sticky top-0 z-20 w-full bg-background/95 backdrop-blur-md'>
        <div className='flex justify-between items-center p-3 sm:p-4'>
          <div className='w-10'></div>
          <div className='flex items-center'>
            <Skeleton className='h-8 w-32 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg' />
          </div>
          <div className='w-10 flex justify-end'>
            <Skeleton className='h-6 w-6 rounded-full' />
          </div>
        </div>
      </header>

      {/* Category Selector Skeleton */}
      <div className='sticky top-16 z-10 w-full border-b border-muted/50 h-14 bg-background/80 backdrop-blur-xl'>
        <div className='flex items-center h-full gap-3 px-4 py-2 overflow-x-auto no-scrollbar justify-center'>
          <Skeleton className='flex-none h-8 rounded-full min-w-24 bg-primary/80' />{' '}
          {/* Wszystkie - active */}
          <Skeleton className='flex-none h-8 rounded-full min-w-20' />{' '}
          {/* Imprezy */}
          <Skeleton className='flex-none h-8 rounded-full min-w-16' />{' '}
          {/* Kursy */}
          <Skeleton className='flex-none h-8 rounded-full min-w-16' />{' '}
          {/* Sport */}
        </div>
      </div>

      {/* Event Feed Skeleton */}
      <div className='w-full mt-4 sm:mt-6 transition-all duration-300'>
        <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-0 sm:px-4'>
          <div className='flex flex-col'>
            {/* Single detailed event card skeleton that matches the screenshot */}
            <div className='mb-4 overflow-hidden rounded-lg border border-muted'>
              {/* Event header with org info and category */}
              <div className='flex items-center justify-between p-4'>
                <div className='flex items-center gap-2'>
                  {/* Organization avatar with letter */}
                  <div className='relative h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center'>
                    <Skeleton className='h-8 w-8 rounded-full absolute' />
                  </div>
                  {/* Organization name */}
                  <Skeleton className='h-5 w-24' />
                </div>
                {/* Category badge */}
                <Skeleton className='h-6 w-16 rounded-full' />
              </div>

              {/* Main event image */}
              <Skeleton className='aspect-[16/9] w-full' />

              {/* Event details */}
              <div className='p-4 space-y-4'>
                {/* Title */}
                <Skeleton className='h-7 w-1/4' />

                {/* Event metadata */}
                <div className='space-y-2'>
                  {/* Date */}
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-5 w-5 rounded-sm' />{' '}
                    {/* Calendar icon */}
                    <Skeleton className='h-5 w-36' />
                  </div>

                  {/* Time */}
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-5 w-5 rounded-sm' />{' '}
                    {/* Clock icon */}
                    <Skeleton className='h-5 w-28' />
                  </div>

                  {/* Location */}
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-5 w-5 rounded-sm' />{' '}
                    {/* Location icon */}
                    <Skeleton className='h-5 w-20' />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
