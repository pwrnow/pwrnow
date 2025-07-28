import { Skeleton } from '@/components/ui/skeleton';

export function EventCardSkeleton() {
  return (
    <div className='mb-8 border-0 sm:border sm:rounded-lg sm:shadow-sm overflow-hidden'>
      <div className='flex flex-col'>
        <div className='px-3 py-2 sm:px-4 sm:py-3 flex items-center space-x-2 sm:space-x-3'>
          <Skeleton className='h-8 w-8 sm:h-10 sm:w-10 rounded-full' />
          <div className='flex-1'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-24 sm:w-32' />
              <Skeleton className='h-6 w-16' />
            </div>
          </div>
        </div>
        <Skeleton className='w-full aspect-[16/9]' />
        <div className='px-3 pt-3 sm:px-4 sm:pt-4 pb-4 sm:pb-6'>
          <Skeleton className='h-6 sm:h-7 md:h-8 w-3/4 mb-2 sm:mb-3' />
          <div className='flex flex-col space-y-2 mb-3 sm:mb-4'>
            <div className='flex items-center'>
              <Skeleton className='h-6 w-6 mr-2' />
              <Skeleton className='h-4 w-24' />
            </div>
            <div className='flex items-center'>
              <Skeleton className='h-6 w-6 mr-2' />
              <Skeleton className='h-4 w-20' />
            </div>
            <div className='flex items-center'>
              <Skeleton className='h-6 w-6 mr-2' />
              <Skeleton className='h-4 w-32' />
            </div>
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
          </div>
          <div className='mt-3'>
            <Skeleton className='h-10 w-full' />
          </div>
        </div>
      </div>
      <div className='h-px bg-border sm:hidden mt-2 mb-2'></div>
    </div>
  );
}
