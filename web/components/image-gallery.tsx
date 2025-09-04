'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { PostImage } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface ImageGalleryProps {
  images: PostImage[];
  isOpen: boolean;
  initialIndex: number;
  onClose: () => void;
}

export default function ImageGallery({
  images,
  isOpen,
  initialIndex,
  onClose,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageTransition, setImageTransition] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Sort images by order_index
  const sortedImages = [...images].sort(
    (a, b) => a.order_index - b.order_index
  );

  // Reset state when gallery opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      setIsLoading(true);
    }
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          setCurrentIndex((prev) =>
            prev > 0 ? prev - 1 : sortedImages.length - 1
          );
          setIsZoomed(false);
          break;
        case 'ArrowRight':
          event.preventDefault();
          setCurrentIndex((prev) =>
            prev < sortedImages.length - 1 ? prev + 1 : 0
          );
          setIsZoomed(false);
          break;
      }
    },
    [isOpen, onClose, sortedImages.length]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when gallery is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const goToPrevious = () => {
    setImageTransition(true);
    setIsLoading(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        prev > 0 ? prev - 1 : sortedImages.length - 1
      );
      setIsZoomed(false);
      setImageTransition(false);
    }, 150);
  };

  const goToNext = () => {
    setImageTransition(true);
    setIsLoading(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        prev < sortedImages.length - 1 ? prev + 1 : 0
      );
      setIsZoomed(false);
      setImageTransition(false);
    }, 150);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    // Only zoom if clicking on the image itself, not the container
    if (e.target === e.currentTarget) return;
    toggleZoom();
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isZoomed) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (isZoomed) return;
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && sortedImages.length > 1) {
      goToNext();
    }
    if (isRightSwipe && sortedImages.length > 1) {
      goToPrevious();
    }
  };

  if (!isOpen || sortedImages.length === 0) return null;

  const currentImage = sortedImages[currentIndex];

  return (
    <div className='fixed inset-0 z-50 bg-black/95 backdrop-blur-sm'>
      {/* Loading indicator */}
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center z-20'>
          <div className='bg-black/20 backdrop-blur-sm rounded-full p-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
          </div>
        </div>
      )}

      {/* Header with controls */}
      <div className='absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent'>
        <div className='flex items-center gap-4'>
          <span className='text-white text-sm font-medium'>
            {currentIndex + 1} / {sortedImages.length}
          </span>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={toggleZoom}
            className='text-white hover:bg-white/20'
          >
            {isZoomed ? (
              <ZoomOut className='h-4 w-4' />
            ) : (
              <ZoomIn className='h-4 w-4' />
            )}
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={onClose}
            className='text-white hover:bg-white/20'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Main image container */}
      <div
        className='absolute inset-0 flex items-center justify-center p-4 pt-16 pb-16'
        onClick={handleImageClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`relative max-w-full max-h-full transition-all duration-300 ease-out ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          } ${imageTransition ? 'opacity-0' : 'opacity-100'}`}
        >
          <Image
            src={currentImage.url}
            alt={`Image ${currentIndex + 1}`}
            width={1200}
            height={800}
            className='max-w-full max-h-full object-contain'
            onLoad={handleImageLoad}
            priority
          />
        </div>
      </div>

      {/* Navigation arrows */}
      {sortedImages.length > 1 && (
        <>
          <Button
            variant='ghost'
            size='lg'
            onClick={goToPrevious}
            className='absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-3'
          >
            <ChevronLeft className='h-6 w-6' />
          </Button>
          <Button
            variant='ghost'
            size='lg'
            onClick={goToNext}
            className='absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-3'
          >
            <ChevronRight className='h-6 w-6' />
          </Button>
        </>
      )}

      {/* Thumbnail strip */}
      {sortedImages.length > 1 && (
        <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4'>
          <div className='flex justify-center gap-2 overflow-x-auto max-w-full'>
            {sortedImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => {
                  if (index !== currentIndex) {
                    setImageTransition(true);
                    setIsLoading(true);
                    setTimeout(() => {
                      setCurrentIndex(index);
                      setIsZoomed(false);
                      setImageTransition(false);
                    }, 150);
                  }
                }}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                  index === currentIndex
                    ? 'ring-2 ring-white scale-110'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  width={64}
                  height={64}
                  className='w-full h-full object-cover'
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Touch/swipe areas for mobile */}
      {sortedImages.length > 1 && (
        <>
          <div
            className='absolute left-0 top-0 bottom-0 w-20 md:hidden'
            onClick={goToPrevious}
          />
          <div
            className='absolute right-0 top-0 bottom-0 w-20 md:hidden'
            onClick={goToNext}
          />
        </>
      )}
    </div>
  );
}
