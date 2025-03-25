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
    <ScrollArea className='w-full'>
      <div className='flex gap-2 px-3 py-2 overflow-x-auto justify-center'>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === category
                ? 'category-active shadow-md'
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
