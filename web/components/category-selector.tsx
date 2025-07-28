'use client';

import { useEffect, useRef, useState } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Category } from '@/lib/types';

interface CategoryWithId extends Category {
  id: string;
}

export default function CategorySelector({
  categories = [],
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialRender, setIsInitialRender] = useState(true);

  const currentCategory = searchParams.get('category') || 'wszystkie';

  // Add "Wszystkie" category to the beginning of the list
  const allCategories: CategoryWithId[] = [
    { id: 'all', name: 'Wszystkie', slug: 'wszystkie' },
    ...categories.map((cat, index) => ({ ...cat, id: `cat-${index}` })),
  ];

  const handleCategoryChange = (categorySlug: string) => {
    if (categorySlug === currentCategory) return;

    const params = new URLSearchParams(searchParams);

    if (categorySlug === 'wszystkie') {
      params.delete('category');
    } else {
      params.set('category', categorySlug);
    }

    // Using replace instead of push for smoother navigation without adding to history
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Update the active button rect when the current category changes
  useEffect(() => {
    const activeButton = containerRef.current?.querySelector(
      `[data-slug="${currentCategory}"]`
    ) as HTMLElement;
    if (activeButton) {
      // Scroll the active button into view
      activeButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }

    // After initial render, set isInitialRender to false
    if (isInitialRender) {
      setTimeout(() => setIsInitialRender(false), 100);
    }
  }, [currentCategory, isInitialRender]);

  return (
    <div className='sticky top-0 z-10 w-full border-b border-muted/50 h-14 bg-background/80 backdrop-blur-xl'>
      <ScrollArea className='w-full h-full'>
        <div
          ref={containerRef}
          className='flex items-center justify-center h-full gap-3 px-4 py-2 relative'
        >
          {allCategories.map((category) => (
            <button
              key={category.id}
              data-slug={category.slug}
              onClick={() => handleCategoryChange(category.slug)}
              className={`
                relative flex-none px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                transition-all duration-300 ease-in-out
                ${
                  currentCategory === category.slug
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {category.name}
              {currentCategory === category.slug && (
                <motion.span
                  layoutId='activeCategory'
                  initial={isInitialRender ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  className='absolute inset-0 bg-primary rounded-full -z-10'
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                    opacity: { duration: 0.2 },
                  }}
                />
              )}
            </button>
          ))}
        </div>
        <ScrollBar
          orientation='horizontal'
          className='opacity-0 hover:opacity-100 transition-opacity'
        />
      </ScrollArea>
    </div>
  );
}
