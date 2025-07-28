import { Skeleton } from '@/components/ui/skeleton';

export function CategorySelectorSkeleton() {
  return (
    <div className='sticky top-0 z-10 w-full border-b border-muted/50 h-14 bg-background/80 backdrop-blur-xl'>
      <div className='flex items-center justify-center h-full gap-3 px-4 py-2'>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className='h-8 w-20 rounded-full' />
        ))}
      </div>
    </div>
  );
}
