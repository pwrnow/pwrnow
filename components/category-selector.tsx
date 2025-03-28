'use client';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CategorySelector({
  categories = [],
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') || 'wszystkie';

  // Memoize allCategories to prevent unnecessary recalculations
  const allCategories = useMemo(
    () => [{ id: 'all', name: 'Wszystkie', slug: 'wszystkie' }, ...categories],
    [categories]
  );

  // Simplified category change handler without transitions
  const handleCategoryChange = useCallback(
    (categorySlug: string) => {
      if (categorySlug === currentCategory) return;

      // Create new URLSearchParams but don't convert toString() yet for efficiency
      const params = new URLSearchParams(searchParams);

      if (categorySlug === 'wszystkie') {
        params.delete('category');
      } else {
        params.set('category', categorySlug);
      }

      // Use replace with client-side updates only
      const newPath = `${pathname}?${params.toString()}`;
      router.replace(newPath, {
        scroll: false,
      });
    },
    [currentCategory, pathname, router, searchParams]
  );

  return (
    <div className='sticky top-0 z-10 w-full border-b border-muted/50 h-14 bg-background/80 backdrop-blur-xl shadow-sm'>
      <ScrollArea className='w-full h-full'>
        <div className='flex items-center h-full gap-3 px-4 md:px-6 md:justify-center'>
          {allCategories.map((category) => {
            const isActive = currentCategory === category.slug;

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.slug)}
                className={`relative flex-none px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap overflow-hidden
                  ${
                    isActive
                      ? 'text-primary-foreground bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 dark:from-indigo-600 dark:via-blue-600 dark:to-cyan-500 shadow-md'
                      : 'bg-muted/30 hover:bg-muted/80 dark:hover:bg-muted/50 text-foreground/80'
                  }
                  transition-colors duration-150
                `}
              >
                <span className='relative z-10 tracking-wide'>
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation='horizontal' className='h-1.5' />
      </ScrollArea>
    </div>
  );
}
