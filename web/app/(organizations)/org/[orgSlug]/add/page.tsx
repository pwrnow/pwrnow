'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import AddEventForm from '@/components/add-event-form';
import { getCategories, getCurrentOrganization } from '@/lib/api';
import { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';

export default function AddEventPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const t = useTranslations('AddEventPage');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Verify that the organization is authenticated and matches the slug
        let currentOrg;
        try {
          currentOrg = await getCurrentOrganization();

          // Verify that the URL slug matches the authenticated organization
          if (currentOrg.slug !== orgSlug) {
            console.error(
              'URL slug does not match authenticated organization:',
              {
                urlSlug: orgSlug,
                authOrgSlug: currentOrg.slug,
              }
            );
            setError(t('accessDenied'));
            return;
          }
        } catch {
          console.error('No authenticated organization found');
          // Redirect to home page if not authenticated
          router.push('/');
          return;
        }

        // Load categories
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error('❌ Failed to load add event page data:', err);
        setError(t('loadError'));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [orgSlug, router, t]);

  if (loading) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-4 py-4'>
          {/* Header skeleton */}
          <div className='flex items-center gap-4 mb-8'>
            <Skeleton className='w-10 h-10 rounded-md' />
            <Skeleton className='h-8 w-48' />
          </div>

          {/* Form skeleton */}
          <Card className='p-6'>
            <div className='space-y-6'>
              {[...Array(8)].map((_, i) => (
                <div key={i} className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-10 w-full' />
                </div>
              ))}
              <Skeleton className='h-10 w-full' />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-4 py-4'>
          <div className='flex items-center gap-4 mb-8'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => router.push(`/org/${orgSlug}`)}
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <h1 className='text-2xl font-bold display-font'>{t('title')}</h1>
          </div>

          <Card className='p-6'>
            <div className='text-center'>
              <p className='text-destructive mb-4'>{error}</p>
              <Button onClick={() => router.refresh()}>{t('tryAgain')}</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-4 py-4'>
        {/* Header */}
        <div className='relative flex items-center justify-center mb-8'>
          <Button
            variant='ghost'
            size='sm'
            className='gap-2 cursor-pointer absolute left-0'
            onClick={() => router.push(`/org/${orgSlug}`)}
          >
            <ArrowLeft className='h-4 w-4' />
            <span>{t('back')}</span>
          </Button>
          <h1 className='text-xl font-bold display-font text-center'>
            {t('title')}
          </h1>
        </div>

        {/* Form */}
        <Card className='p-6'>
          <AddEventForm organizationCode={orgSlug} categories={categories} />
        </Card>
      </div>
    </div>
  );
}
