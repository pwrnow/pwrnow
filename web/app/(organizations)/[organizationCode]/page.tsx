'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { authenticateOrganization } from '@/lib/api';
import { ApiError, type Organization } from '@/lib/types';

export default function OrganizationCodePage() {
  const params = useParams();
  const router = useRouter();
  const organizationCode = params.organizationCode as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function authenticateAndRedirect() {
      try {
        setLoading(true);
        setError(null);

        // Always authenticate with the organization code from the URL
        // This will force authentication even if already authenticated to a different org
        console.log('Authenticating with organization code:', organizationCode);
        const authResponse = await authenticateOrganization(organizationCode);
        const currentOrg = authResponse.organization;
        console.log('Successfully authenticated organization:', currentOrg);

        // Redirect to org slug URL after successful authentication
        console.log('Redirecting to org slug:', currentOrg.slug);
        router.replace(`/org/${currentOrg.slug}`);
      } catch (authError) {
        console.error('Authentication failed:', authError);
        if (authError instanceof ApiError) {
          switch (authError.status) {
            case 400:
              if (authError.message.includes('required')) {
                setError('Kod organizacji jest wymagany');
              } else if (
                authError.message.includes('Invalid authentication code')
              ) {
                setError('Nieprawidłowy kod organizacji');
              } else {
                setError('Nieprawidłowe dane żądania');
              }
              break;
            case 401:
              setError('Nieprawidłowy kod organizacji');
              break;
            case 500:
              setError('Błąd serwera podczas uwierzytelniania');
              break;
            default:
              setError(
                authError.message || 'Błąd uwierzytelniania organizacji'
              );
          }
        } else {
          setError('Nie udało się uwierzytelnić organizacji');
        }
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
          <p className='text-muted-foreground mt-4'>
            Uwierzytelnianie organizacji...
          </p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <Card className='w-full max-w-md p-8 text-center'>
          <h1 className='text-2xl font-bold text-destructive mb-4'>Błąd</h1>
          <p className='text-muted-foreground mb-6'>{error}</p>
          <Button onClick={() => router.push('/')} variant='outline'>
            Powrót do strony głównej
          </Button>
        </Card>
      </div>
    );
  }

  return null;
}
