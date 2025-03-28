import { Skeleton } from '@/components/ui/skeleton';

export function EventCardSkeleton() {
  return (
    <div className='mb-8 border-0 sm:border sm:rounded-lg sm:shadow-sm animate-in fade-in-50'>
      <div className='flex flex-col'>
        {/* Header with avatar */}
        <div className='px-3 py-2 sm:px-4 sm:py-3 flex items-center space-x-2 sm:space-x-3'>
          <Skeleton className='h-8 w-8 sm:h-10 sm:w-10 rounded-full' />
          <div className='flex-1'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-20' />
            </div>
          </div>
        </div>

        {/* Image placeholder */}
        <Skeleton className='w-full aspect-square' />

        {/* Content */}
        <div className='px-3 pt-3 sm:px-4 sm:pt-4 pb-4 sm:pb-6'>
          <Skeleton className='h-7 sm:h-8 w-full mb-2 sm:mb-3' />

          <div className='flex flex-col space-y-2 mb-3 sm:mb-4'>
            {/* Date */}
            <div className='flex items-center'>
              <Skeleton className='h-8 w-8 mr-2 rounded-md' />
              <Skeleton className='h-4 w-32' />
            </div>
            {/* Time */}
            <div className='flex items-center'>
              <Skeleton className='h-8 w-8 mr-2 rounded-md' />
              <Skeleton className='h-4 w-24' />
            </div>
            {/* Location */}
            <div className='flex items-center'>
              <Skeleton className='h-8 w-8 mr-2 rounded-md' />
              <Skeleton className='h-4 w-40' />
            </div>
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-3 w-11/12' />
            <Skeleton className='h-3 w-4/5' />
          </div>

          {/* Button */}
          <div className='mt-3'>
            <Skeleton className='h-9 w-full' />
          </div>
        </div>
      </div>

      <div className='h-px bg-border sm:hidden mt-2 mb-2'></div>
    </div>
  );
}
