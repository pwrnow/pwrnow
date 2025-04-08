'use client';

import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface DropzoneProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrop'> {
  className?: string;
  onDrop: (acceptedFiles: File[]) => void;
}

export function Dropzone({ className, onDrop, ...props }: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      },
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024, // 5MB max file size
      validator: (file) => {
        if (file.size > 5 * 1024 * 1024) {
          return {
            code: 'file-too-large',
            message: `Rozmiar pliku nie może przekraczać 5MB`,
          };
        }
        return null;
      },
    });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary',
        className
      )}
      {...props}
    >
      <input {...getInputProps()} />
      <div className='text-center'>
        {isDragActive ? (
          <p className='text-primary'>Upuść zdjęcie tutaj...</p>
        ) : (
          <div className='space-y-1'>
            <p>Przeciągnij i upuść zdjęcie lub kliknij, aby wybrać</p>
            <p className='text-sm text-muted-foreground'>
              (Akceptowane formaty: JPEG, PNG, GIF, WebP)
            </p>
            <p className='text-sm text-muted-foreground'>
              (Maksymalny rozmiar: 5MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
