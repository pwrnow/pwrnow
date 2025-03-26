'use client';

import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface DropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  onDrop: (acceptedFiles: File[]) => void;
}

export function Dropzone({ className, onDrop, ...props }: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxFiles: 1,
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
          </div>
        )}
      </div>
    </div>
  );
}
