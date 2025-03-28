'use client';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

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
  const [selectedCategory, setSelectedCategory] = useState('');

  const currentCategory = searchParams.get('category') || 'wszystkie';

  useEffect(() => {
    setSelectedCategory(currentCategory);
  }, [currentCategory]);

  const handleCategoryChange = (categorySlug: string) => {
    if (categorySlug === currentCategory) return;

    setSelectedCategory(categorySlug);

    const params = new URLSearchParams(searchParams);

    if (categorySlug === 'wszystkie') {
      params.delete('category');
    } else {
      params.set('category', categorySlug);
    }

    // Using replace instead of push for smoother navigation without adding to history
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Add "Wszystkie" category to the beginning of the list
  const allCategories = [
    { id: 'all', name: 'Wszystkie', slug: 'wszystkie' },
    ...categories,
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.div
      className='sticky top-0 z-10 w-full border-b border-muted/50 h-14 bg-background/80 backdrop-blur-xl shadow-sm'
      initial='hidden'
      animate='visible'
      variants={containerVariants}
    >
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
                `}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 5 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                    delay: 0.03 * allCategories.indexOf(category),
                  },
                }}
              >
                {isActive && (
                  <motion.div
                    className='absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 dark:from-indigo-600 dark:via-blue-600 dark:to-cyan-500'
                    layoutId='activeCategory'
                    transition={{
                      type: 'spring',
                      stiffness: 400,
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
    </motion.div>
  );
}
