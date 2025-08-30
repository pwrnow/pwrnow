'use client';

import { Event } from '@/lib/types';
import { useTranslations } from 'next-intl';

interface OrganizationStatsProps {
  events: Event[];
  isUpcoming: (dateString: string) => boolean;
}

export default function OrganizationStats({
  events,
  isUpcoming,
}: OrganizationStatsProps) {
  const t = useTranslations('OrganizationPage');

  const upcomingCount = events.filter((event) =>
    isUpcoming(event.starts_at)
  ).length;
  const completedCount = events.filter(
    (event) => !isUpcoming(event.starts_at)
  ).length;
  const verifiedCount = events.filter((event) => event.verified).length;

  return (
    <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-background/50'>
      <div className='flex flex-col items-center p-2 text-center'>
        <span className='text-2xl font-bold text-primary'>{events.length}</span>
        <span className='text-xs text-muted-foreground'>{t('allEvents')}</span>
      </div>
      <div className='flex flex-col items-center p-2 text-center'>
        <span className='text-2xl font-bold text-primary'>{upcomingCount}</span>
        <span className='text-xs text-muted-foreground'>
          {t('upcomingEvents')}
        </span>
      </div>
      <div className='flex flex-col items-center p-2 text-center'>
        <span className='text-2xl font-bold text-primary'>
          {completedCount}
        </span>
        <span className='text-xs text-muted-foreground'>{t('completed')}</span>
      </div>
      <div className='flex flex-col items-center p-2 text-center'>
        <span className='text-2xl font-bold text-primary'>{verifiedCount}</span>
        <span className='text-xs text-muted-foreground'>{t('verified')}</span>
      </div>
    </div>
  );
}
