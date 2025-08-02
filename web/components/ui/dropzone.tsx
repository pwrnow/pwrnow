'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DropzoneProps {
  onDrop: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Dropzone({
  onDrop,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  multiple = false,
  className,
  children,
  ...props
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const t = useTranslations('Dropzone');

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter((file) => {
        // Check file type
        if (accept && !file.type.match(accept.replace('*', '.*'))) {
          return false;
        }
        // Check file size
        if (maxSize && file.size > maxSize) {
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        onDrop(multiple ? validFiles : [validFiles[0]]);
      }
    },
    [onDrop, accept, maxSize, multiple]
  );

  const handleDragOver = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(true);
    },
    []
  );

  const handleDragLeave = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
    },
    []
  );

  const handleClick = React.useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onDrop(multiple ? files : [files[0]]);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    },
    [onDrop, multiple]
  );

  return (
    <>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          isDragOver
            ? 'border-primary bg-primary/10'
            : 'border-muted-foreground/25',
          className
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        {...props}
      >
        {children || (
          <div className='flex flex-col items-center gap-2'>
            <Upload className='size-8 text-muted-foreground' />
            <div className='text-sm'>
              <span className='font-medium'>{t('clickToSelect')}</span>{' '}
              {t('orDragHere')}
            </div>
            <div className='text-xs text-muted-foreground'>
              {t('maxSize', { size: Math.round(maxSize / 1024 / 1024) })}
            </div>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type='file'
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className='hidden'
      />
    </>
  );
}
