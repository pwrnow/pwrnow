'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

type FilterType = 'all' | 'verified' | 'unverified';

interface EventsEmptyStateProps {
  filter: FilterType;
  orgSlug: string;
}

export default function EventsEmptyState({
  filter,
  orgSlug,
}: EventsEmptyStateProps) {
  const router = useRouter();
  const t = useTranslations('OrganizationPage');

  const getEmptyStateText = () => {
    switch (filter) {
      case 'verified':
        return {
          title: t('noVerifiedEvents'),
          description: t('changeFilter'),
        };
      case 'unverified':
        return {
          title: t('noUnverifiedEvents'),
          description: t('changeFilter'),
        };
      default:
        return {
          title: t('noEvents'),
          description: t('addFirstEvent'),
        };
    }
  };

  const { title, description } = getEmptyStateText();

  return (
    <Card className='p-12 text-center shadow-lg'>
      <div className='max-w-md mx-auto'>
        <div className='w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6'>
          <Calendar className='w-10 h-10 text-muted-foreground' />
        </div>
        <h3 className='text-xl font-semibold mb-3'>{title}</h3>
        <p className='text-muted-foreground mb-6'>{description}</p>
        <Button
          onClick={() => router.push(`/org/${orgSlug}/add`)}
          className='cursor-pointer'
        >
          <PlusCircle className='w-4 h-4 mr-2' />
          {t('addEvent')}
        </Button>
      </div>
    </Card>
  );
}
