'use client';

import { useState, useEffect, useTransition } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

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

  const handleCategoryChange = (categorySlug: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);

      if (categorySlug === 'wszystkie') {
        params.delete('category');
      } else {
        params.set('category', categorySlug);
      }

      router.push(`${pathname}?${params.toString()}`);
    });
  };

  // Add "Wszystkie" category to the beginning of the list
  const allCategories = [
    { id: 'all', name: 'Wszystkie', slug: 'wszystkie' },
    ...categories,
  ];

  return (
    <div className='sticky top-0 z-10 w-full border-b border-muted/50 h-12 bg-background/50 backdrop-blur-md'>
      <ScrollArea className='w-full h-full'>
        <div className='flex items-center justify-center h-full gap-2 px-4'>
          {allCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.slug)}
              className={`flex-none px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                currentCategory === category.slug
                  ? 'category-active shadow-md'
                  : 'bg-muted/50 hover:bg-muted/80'
              }`}
              disabled={isPending}
            >
              {category.name}
            </button>
          ))}
        </div>
        <ScrollBar orientation='horizontal' />
      </ScrollArea>
    </div>
  );
}
