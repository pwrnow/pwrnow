import { CalendarX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NoEventsMessage() {
  const t = useTranslations('NoEventsMessage');

  return (
    <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-4 py-12 text-center'>
      <div className='flex flex-col items-center space-y-4'>
        <div className='p-4 rounded-full bg-muted'>
          <CalendarX className='h-8 w-8 text-muted-foreground' />
        </div>
        <div className='space-y-2'>
          <h3 className='text-lg font-semibold'>{t('title')}</h3>
          <p className='text-muted-foreground'>{t('description')}</p>
        </div>
        <Link href='/'>
          <Button variant='outline' className='mt-4'>
            {t('viewAllEvents')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
