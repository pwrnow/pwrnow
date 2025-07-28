import { Skeleton } from '@/components/ui/skeleton';

export function CategorySelectorSkeleton() {
  return (
    <div className='sticky top-0 z-10 w-full border-b border-muted/50 h-12 bg-background/50 backdrop-blur-md'>
      <div className='flex items-center justify-center h-full gap-2 px-4 overflow-x-auto'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className='flex-none h-7 w-20 rounded-full' />
        ))}
      </div>
    </div>
  );
}
