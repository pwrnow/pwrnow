'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrganizationPageSkeleton() {
  return (
    <div className='w-full mx-auto max-w-7xl px-4 py-6'>
      {/* Header Skeleton */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0'>
        <div className='flex items-center space-x-4'>
          <Skeleton className='w-16 h-16 rounded-full' />
          <div>
            <Skeleton className='h-8 w-48 mb-2' />
            <Skeleton className='h-4 w-32' />
          </div>
        </div>
        <div className='flex space-x-3'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-36' />
          <Skeleton className='h-10 w-10' />
        </div>
      </div>

      {/* Events Skeleton */}
      <div className='grid gap-4 md:gap-6'>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className='p-6'>
            <div className='flex justify-between items-start mb-4'>
              <Skeleton className='h-6 w-3/4' />
              <Skeleton className='h-6 w-20' />
            </div>
            <Skeleton className='h-4 w-full mb-2' />
            <Skeleton className='h-4 w-1/2' />
          </Card>
        ))}
      </div>
    </div>
  );
}
