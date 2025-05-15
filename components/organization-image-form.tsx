'use client';

import { useState } from 'react';
import { Dropzone } from '@/components/ui/dropzone';
import { Button } from '@/components/ui/button';
import { updateOrganizationImage } from '@/app/actions/organizations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OrganizationImageFormProps {
  organization: {
    id: string;
    code: string;
    name: string;
    image_url: string | null;
  };
}

export default function OrganizationImageForm({
  organization,
}: OrganizationImageFormProps) {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Get organization initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const orgInitials = getInitials(organization.name);

  const handleImageDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      if (acceptedFiles[0].size > 5 * 1024 * 1024) {
        setImageError('Rozmiar obrazka nie może przekraczać 5MB');
        setImageFile(null);
        setPreviewUrl(null);
      } else {
        setImageError(null);
        setImageFile(acceptedFiles[0]);
        setPreviewUrl(URL.createObjectURL(acceptedFiles[0]));
      }
    }
  };

  const handleSubmit = async () => {
    try {
      // Reset states
      setIsSubmitting(true);
      setImageError(null);
      setFormError(null);
      setSuccess(false);

      if (!imageFile) {
        setImageError('Nie wybrano obrazka');
        setIsSubmitting(false);
        return;
      }

      // Call server action
      const result = await updateOrganizationImage({
        orgCode: organization.code,
        imageFile,
      });

      if (result.success) {
        setSuccess(true);
        setImageFile(null);
        setPreviewUrl(null);
        router.refresh();
      } else {
        if (result.error?.includes('obrazka')) {
          setImageError(result.error);
        } else {
          setFormError(
            result.error || 'Wystąpił błąd podczas aktualizacji zdjęcia'
          );
        }
      }
    } catch (error) {
      console.error('Error updating organization image:', error);
      setFormError('Wystąpił nieoczekiwany błąd podczas aktualizacji zdjęcia');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center space-x-6'>
        <Avatar className='w-20 h-20 border-2 border-primary/30'>
          <AvatarImage
            src={previewUrl || organization.image_url || undefined}
            alt={organization.name}
          />
          <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white text-2xl font-bold'>
            {orgInitials}
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

      <Dropzone className='mt-4' onDrop={handleImageDrop} />

      {imageFile && !imageError && (
        <p className='text-sm'>
          Wybrano: {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)
        </p>
      )}

      {imageError && <p className='text-sm text-destructive'>{imageError}</p>}

      {formError && <p className='text-sm text-destructive'>{formError}</p>}

      {success && (
        <p className='text-sm text-green-500'>
          Zdjęcie zostało pomyślnie zaktualizowane
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !imageFile}
        className='mt-4 flex items-center gap-2'
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
  );
}
