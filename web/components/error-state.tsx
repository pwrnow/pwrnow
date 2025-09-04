'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface ErrorStateProps {
  error: string;
}

export default function ErrorState({ error }: ErrorStateProps) {
  const router = useRouter();
  const t = useTranslations('OrganizationPage');

  return (
    <div className='flex items-center justify-center p-4 min-h-[60vh]'>
      <Card className='w-full max-w-md p-8 text-center shadow-xl'>
        <div className='mb-4'>
          <div className='w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4'>
            <ExternalLink className='w-8 h-8 text-destructive' />
          </div>
          <h1 className='text-2xl font-bold text-destructive mb-2'>
            {t('error')}
          </h1>
          <p className='text-muted-foreground mb-6'>{error}</p>
        </div>
        <Button
          onClick={() => router.push('/')}
          variant='outline'
          className='cursor-pointer'
        >
          {t('backToHome')}
        </Button>
      </Card>
    </div>
  );
}
