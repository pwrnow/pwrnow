'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, ImageIcon, Loader2 } from 'lucide-react';
import {
  getCurrentOrganization,
  uploadOrganizationImage,
} from '@/lib/api';
import { Organization } from '@/lib/types';
import { Card } from '@/components/ui/card';

export default function OrganizationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Image form state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrganization() {
      try {
        setLoading(true);
        setError(null);

        const currentOrg = await getCurrentOrganization();

        // Verify that the URL slug matches the authenticated organization
        if (currentOrg.slug !== orgSlug) {
          setError('Nie masz dostępu do tej organizacji');
          return;
        }

        setOrganization(currentOrg);
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    }

    if (orgSlug) {
      loadOrganization();
    }
  }, [orgSlug, router]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setImageError('Rozmiar obrazka nie może przekraczać 5MB');
        setImageFile(null);
        setPreviewUrl(null);
      } else {
        setImageError(null);
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async () => {
    if (!organization || !imageFile) return;

    try {
      setIsSubmitting(true);
      setImageError(null);
      setFormError(null);
      setSuccess(false);

      const updatedOrg = await uploadOrganizationImage(
        organization.slug,
        imageFile
      );
      setOrganization(updatedOrg);
      setSuccess(true);
      setImageFile(null);
      setPreviewUrl(null);

      // Reset the file input
      const fileInput = document.getElementById(
        'image-upload'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Wystąpił błąd podczas aktualizacji zdjęcia';
      if (errorMessage.includes('obrazka')) {
        setImageError(errorMessage);
      } else {
        setFormError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='max-w-2xl mx-auto px-4 py-4'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-muted rounded w-1/3'></div>
          <div className='h-32 bg-muted rounded'></div>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className='max-w-2xl mx-auto px-4 py-4'>
        <Card className='p-8 text-center'>
          <h1 className='text-2xl font-bold text-destructive mb-4'>Błąd</h1>
          <p className='text-muted-foreground mb-6'>
            {error || 'Nie znaleziono organizacji'}
          </p>
          <Button
            onClick={() => router.push(`/org/${orgSlug}`)}
            variant='outline'
          >
            Powrót
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className='max-w-2xl mx-auto px-4 py-4'>
      <div className='relative flex items-center justify-center mb-6'>
        <Button
          variant='ghost'
          size='sm'
          className='gap-2 cursor-pointer absolute left-0'
          onClick={() => router.push(`/org/${orgSlug}`)}
        >
          <ArrowLeft className='h-4 w-4' />
          <span>Powrót</span>
        </Button>
        <h1 className='text-xl font-bold display-font text-center'>
          Ustawienia organizacji
        </h1>
      </div>

      <div className='space-y-8'>
        <div className='bg-card rounded-lg border p-6'>
          <h2 className='text-xl font-semibold mb-4'>Zdjęcie organizacji</h2>
          <p className='text-muted-foreground mb-6'>
            Zaktualizuj zdjęcie profilu Twojej organizacji, które będzie
            widoczne na stronie organizacji i przy wydarzeniach.
          </p>

          <div className='space-y-6'>
            <div className='flex items-center space-x-6'>
              <Avatar className='w-20 h-20 border-2 border-primary/30'>
                <AvatarImage
                  src={previewUrl || organization.image_url || undefined}
                  alt={organization.name}
                />
                <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white text-2xl font-bold'>
                  {getInitials(organization.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className='font-medium'>Aktualne zdjęcie</h3>
                <p className='text-sm text-muted-foreground'>
                  {organization.image_url
                    ? 'Twoja organizacja ma już zdjęcie profilowe'
                    : 'Twoja organizacja nie ma jeszcze zdjęcia profilowego'}
                </p>
              </div>
            </div>

            <div className='space-y-4'>
              <div>
                <label
                  htmlFor='image-upload'
                  className='block text-sm font-medium mb-2'
                >
                  Wybierz nowe zdjęcie
                </label>
                <input
                  id='image-upload'
                  type='file'
                  accept='image/*'
                  onChange={handleImageChange}
                  className='block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer'
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  Maksymalny rozmiar: 5MB. Obsługiwane formaty: JPG, PNG, WEBP
                </p>
              </div>

              {imageFile && !imageError && (
                <p className='text-sm text-green-600'>
                  Wybrano: {imageFile.name} ({Math.round(imageFile.size / 1024)}{' '}
                  KB)
                </p>
              )}

              {imageError && (
                <p className='text-sm text-destructive'>{imageError}</p>
              )}

              {formError && (
                <p className='text-sm text-destructive'>{formError}</p>
              )}

              {success && (
                <p className='text-sm text-green-600'>
                  Zdjęcie zostało pomyślnie zaktualizowane
                </p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !imageFile}
                className='cursor-pointer flex items-center gap-2'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    <span>Aktualizowanie...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className='h-4 w-4' />
                    <span>Zaktualizuj zdjęcie</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
