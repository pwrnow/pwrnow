'use client';

import { useState, useEffect, useRef } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const categories = [
  'Wszystkie',
  'Imprezy',
  'Kursy',
  'Sport',
  'Kultura',
  'Rozrywka',
];

interface CategorySelectorProps {
  headerHeight?: number;
}

export default function CategorySelector({
  headerHeight = 53,
}: CategorySelectorProps) {
  const [activeCategory, setActiveCategory] = useState('Wszystkie');
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 5;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Immediately show when at the top of the page
      if (currentScrollY < 10) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Regular scroll behavior with threshold
      if (Math.abs(currentScrollY - lastScrollY.current) > scrollThreshold) {
        if (currentScrollY > lastScrollY.current) {
          // Scrolling down
          setIsVisible(false);
        } else {
          // Scrolling up
          setIsVisible(true);
        }

        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className={`sticky z-10 w-full bg-background/95 backdrop-blur-md transition-all duration-300`}
      style={{ top: `${headerHeight}px` }}
    >
      <div
        className={`w-full overflow-hidden transition-all duration-300 ease-in-out ${
          isVisible ? 'max-h-[60px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <ScrollArea className='w-full border-b border-muted'>
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
      </div>
    </div>
  );
}
