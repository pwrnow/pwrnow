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
    <div className='sticky top-0 z-10 w-full border-b border-muted/50 h-12 bg-background/50 backdrop-blur-md'>
      <ScrollArea className='w-full h-full'>
        <div className='flex items-center justify-center h-full gap-2 px-4'>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex-none px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'category-active shadow-md'
                  : 'bg-muted/50 hover:bg-muted/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <ScrollBar orientation='horizontal' />
      </ScrollArea>
    </div>
  );
}
