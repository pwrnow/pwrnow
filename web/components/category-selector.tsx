'use client';

import { useEffect, useRef, useState } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Category } from '@/lib/types';
import { useAnalytics } from '@/lib/useAnalytics';
import { useTranslations } from 'next-intl';

export default function CategorySelector({
  categories = [],
}: {
  categories: Category[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [currentCategory, setCurrentCategory] = useState(
    () => searchParams.get('category') || 'wszystkie'
  );
  const { trackCategoryFilter } = useAnalytics();
  const t = useTranslations('CategorySelector');

  // Add "Wszystkie" category to the beginning of the list
  const allCategories: Category[] = [
    { name: t('allCategories'), slug: 'wszystkie' },
    ...categories,
  ];

  const handleCategoryChange = (
    event: React.MouseEvent<HTMLButtonElement>,
    categorySlug: string
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (categorySlug === currentCategory) return;

    // Track category selection
    trackCategoryFilter(categorySlug);

    // Update local state immediately
    setCurrentCategory(categorySlug);

    // Update URL without page reload using shallow routing
    const params = new URLSearchParams(searchParams);

    if (categorySlug === 'wszystkie') {
      params.delete('category');
    } else {
      params.set('category', categorySlug);
    }

    const newUrl = `${pathname}${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    // Use window.history.replaceState for true shallow routing
    window.history.replaceState(null, '', newUrl);
  };

  // Sync with URL changes (back/forward navigation)
  useEffect(() => {
    const urlCategory = searchParams.get('category') || 'wszystkie';
    if (urlCategory !== currentCategory) {
      setCurrentCategory(urlCategory);
    }
  }, [searchParams]);

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
    <div className='sticky top-0 z-10 w-full h-14 bg-background/80 backdrop-blur-xl'>
      <ScrollArea className='w-full h-full'>
        <div
          ref={containerRef}
          className='flex items-center justify-center h-full gap-3 px-4 py-2 relative'
        >
          {allCategories.map((category) => (
            <button
              key={category.slug}
              type='button'
              data-slug={category.slug}
              onClick={(event) => handleCategoryChange(event, category.slug)}
              className={`
                relative flex-none px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                transition-all duration-300 ease-in-out cursor-pointer
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
              {category.slug === 'rekrutacja' && (
                <motion.div
                  className='absolute inset-0 rounded-full'
                  style={{
                    background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6, #8b5cf6, #ec4899)',
                    backgroundSize: '400% 400%',
                    padding: '2px',
                    zIndex: -1,
                  }}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className='w-full h-full rounded-full bg-background' />
                </motion.div>
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