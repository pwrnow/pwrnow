'use client';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCallback, useMemo, useState, useTransition } from 'react';

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
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get('category') || 'wszystkie';

  // Memoize allCategories to prevent unnecessary recalculations
  const allCategories = useMemo(
    () => [{ id: 'all', name: 'Wszystkie', slug: 'wszystkie' }, ...categories],
    [categories]
  );

  // Optimize the category change handler
  const handleCategoryChange = useCallback(
    (categorySlug: string) => {
      if (categorySlug === currentCategory) return;

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (categorySlug === 'wszystkie') {
          params.delete('category');
        } else {
          params.set('category', categorySlug);
        }

        router.replace(`${pathname}?${params.toString()}`, {
          scroll: false,
        });
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
              <motion.button
                key={category.id}
                onClick={() => handleCategoryChange(category.slug)}
                className={`relative flex-none px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap overflow-hidden
                  ${
                    isActive
                      ? 'text-primary-foreground shadow-md'
                      : 'bg-muted/30 hover:bg-muted/80 dark:hover:bg-muted/50 text-foreground/80'
                  }
                  ${isPending ? 'opacity-70 pointer-events-none' : ''}
                `}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                layoutId={isActive ? 'activeCategory' : undefined}
              >
                {isActive && (
                  <motion.div
                    className='absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 dark:from-indigo-600 dark:via-blue-600 dark:to-cyan-500'
                    layoutId='activeCategoryBg'
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 40,
                    }}
                  />
                )}
                <span className='relative z-10 tracking-wide'>
                  {category.name}
                </span>
              </motion.button>
            );
          })}
        </div>
        <ScrollBar orientation='horizontal' className='h-1.5' />
      </ScrollArea>
    </div>
  );
}
