'use client';

import { useState } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const categories = [
  'Wszystkie',
  'Imprezy',
  'Kursy',
  'Sport',
  'Kultura',
  'Rozrywka',
];

export default function CategorySelector() {
  const [activeCategory, setActiveCategory] = useState('Wszystkie');

  return (
    <ScrollArea className='w-full pb-2'>
      <div className='flex gap-2 px-4 py-2 overflow-x-auto'>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === category
                ? 'category-active shadow-lg'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <ScrollBar orientation='horizontal' />
    </ScrollArea>
  );
}
