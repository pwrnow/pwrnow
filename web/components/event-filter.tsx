'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';
import { Event } from '@/lib/types';
import { useTranslations } from 'next-intl';

type FilterType = 'all' | 'verified' | 'unverified';

interface EventFilterProps {
  events: Event[];
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export default function EventFilter({
  events,
  filter,
  onFilterChange,
}: EventFilterProps) {
  const t = useTranslations('OrganizationPage');

  const filterOptions = [
    { key: 'all', label: t('all'), count: events.length },
    {
      key: 'verified',
      label: t('verified'),
      count: events.filter((e) => e.verified).length,
    },
    {
      key: 'unverified',
      label: t('unverified'),
      count: events.filter((e) => !e.verified).length,
    },
  ];

  return (
    <div className='mb-8'>
      <div className='flex items-center space-x-4 p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm'>
        <Filter className='w-5 h-5 text-muted-foreground' />
        <span className='text-sm font-medium text-muted-foreground'>
          {t('filter')}:
        </span>
        <div className='flex space-x-2'>
          {filterOptions.map((filterOption) => (
            <Button
              key={filterOption.key}
              variant={filter === filterOption.key ? 'default' : 'ghost'}
              size='sm'
              onClick={() => onFilterChange(filterOption.key as FilterType)}
              className={`cursor-pointer transition-all duration-200 ${
                filter === filterOption.key
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:from-primary/90 hover:to-secondary/90 hover:shadow-lg'
                  : 'hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:text-primary border-transparent hover:border-primary/20'
              }`}
            >
              {filterOption.label}
              <Badge
                variant='secondary'
                className={`ml-2 text-xs transition-colors duration-200 ${
                  filter === filterOption.key
                    ? 'bg-white/20 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {filterOption.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
