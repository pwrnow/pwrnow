'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { authenticateOrganization } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { useAnalytics } from '@/lib/useAnalytics';

export default function OrganizationCodePage() {
  const params = useParams();
  const router = useRouter();
  const organizationCode = params.organizationCode as string;
  const t = useTranslations('AuthPage');
  const { trackOrgAuth } = useAnalytics();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function authenticateAndRedirect() {
      try {
        setLoading(true);

        // Always authenticate with the organization code from the URL
        // This will force authentication even if already authenticated to a different org
        console.log('Authenticating with organization code:', organizationCode);
        const authResponse = await authenticateOrganization(organizationCode);
        const currentOrg = authResponse.organization;
        console.log('Successfully authenticated organization:', currentOrg);

        // Track successful authentication
        trackOrgAuth(organizationCode, true);

        // Redirect to org slug URL after successful authentication
        console.log('Redirecting to org slug:', currentOrg.slug);
        router.replace(`/org/${currentOrg.slug}`);
      } catch (authError) {
        console.error('Authentication failed:', authError);
        
        // Track failed authentication
        trackOrgAuth(organizationCode, false);
        
        // Redirect to main page on authentication failure
        router.replace('/');
      } finally {
        setLoading(false);
      }
    }

    if (organizationCode) {
      console.log(
        'Starting authentication with organization code:',
        organizationCode
      );
      authenticateAndRedirect();
    }
  }, [organizationCode, router]);

  if (loading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <Card className='w-full max-w-md p-8 text-center'>
          <div className='space-y-4'>
            <Skeleton className='h-8 w-3/4 mx-auto' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-2/3 mx-auto' />
          </div>
          <p className='text-muted-foreground mt-4'>{t('authenticating')}</p>
        </Card>
      </div>
    );
  }

  return null;
}
