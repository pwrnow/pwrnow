'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trash2, ImageIcon, ShieldCheck, Clock3 } from 'lucide-react';
import ImageGallery from '@/components/image-gallery';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Post } from '@/lib/types';
import { deletePost } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface PostsListProps {
  posts: Post[];
  onPostDeleted: (postId: string) => void;
  organizationId: string;
}

export default function PostsList({
  posts,
  onPostDeleted,
  organizationId,
}: PostsListProps) {
  const t = useTranslations('PostsList');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<Post['images']>([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatPostTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) {
      return t('justNow');
    } else if (diffInMinutes < 60) {
      return t('minutesAgo', { count: diffInMinutes });
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return t('hoursAgo', { count: hours });
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      if (days < 7) {
        return t('daysAgo', { count: days });
      } else {
        return date.toLocaleDateString('pl-PL', {
          day: 'numeric',
          month: 'short',
          year:
            date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
      }
    }
  };

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    setDeleting(true);
    try {
      await deletePost(postToDelete);
      onPostDeleted(postToDelete);
      toast.success(t('postDeleted'));
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error(t('deleteError'));
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const openGallery = (images: Post['images'], index: number) => {
    setGalleryImages(images);
    setGalleryInitialIndex(index);
    setGalleryOpen(true);
  };

  const closeGallery = () => {
    setGalleryOpen(false);
  };

  const renderImages = (images: Post['images']) => {
    if (!images || images.length === 0) return null;

    const sortedImages = [...images].sort(
      (a, b) => a.order_index - b.order_index
    );

    if (sortedImages.length === 1) {
      return (
        <div className='mt-1 rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity'>
          <Image
            src={sortedImages[0].url}
            alt='Post image'
            width={600}
            height={400}
            className='w-full h-auto object-cover max-h-[500px]'
            onClick={() => openGallery(images, 0)}
          />
        </div>
      );
    }

    if (sortedImages.length === 2) {
      return (
        <div className='mt-1 grid grid-cols-2 gap-2 rounded-lg overflow-hidden'>
          {sortedImages.map((image, index) => (
            <div
              key={image.id}
              className='aspect-square cursor-pointer hover:opacity-95 transition-opacity'
              onClick={() => openGallery(images, index)}
            >
              <Image
                src={image.url}
                alt={`Post image ${index + 1}`}
                width={300}
                height={300}
                className='w-full h-full object-cover'
              />
            </div>
          ))}
        </div>
      );
    }

    if (sortedImages.length === 3) {
      return (
        <div className='mt-1 grid grid-cols-2 gap-2 rounded-lg overflow-hidden'>
          <div
            className='cursor-pointer hover:opacity-95 transition-opacity'
            onClick={() => openGallery(images, 0)}
          >
            <Image
              src={sortedImages[0].url}
              alt='Post image 1'
              width={300}
              height={600}
              className='w-full h-full object-cover aspect-[4/5]'
            />
          </div>
          <div className='grid grid-rows-2 gap-2'>
            {sortedImages.slice(1, 3).map((image, index) => (
              <div
                key={image.id}
                className='aspect-square cursor-pointer hover:opacity-95 transition-opacity'
                onClick={() => openGallery(images, index + 1)}
              >
                <Image
                  src={image.url}
                  alt={`Post image ${index + 2}`}
                  width={300}
                  height={300}
                  className='w-full h-full object-cover'
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 4 or more images
    return (
      <div className='mt-1 grid grid-cols-2 gap-2 rounded-lg overflow-hidden'>
        {sortedImages.slice(0, 3).map((image, index) => (
          <div
            key={image.id}
            className='aspect-square cursor-pointer hover:opacity-95 transition-opacity'
            onClick={() => openGallery(images, index)}
          >
            <Image
              src={image.url}
              alt={`Post image ${index + 1}`}
              width={300}
              height={300}
              className='w-full h-full object-cover'
            />
          </div>
        ))}
        <div
          className='aspect-square bg-black/80 flex items-center justify-center relative cursor-pointer hover:opacity-95 transition-opacity'
          onClick={() => openGallery(images, 3)}
        >
          <Image
            src={sortedImages[3].url}
            alt='Post image 4'
            width={300}
            height={300}
            className='w-full h-full object-cover opacity-50'
          />
          {sortedImages.length > 4 && (
            <div className='absolute inset-0 bg-black/60 flex items-center justify-center'>
              <span className='text-white text-xl font-bold'>
                +{sortedImages.length - 3}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-0 sm:px-4'>
        <div className='space-y-4'>
          {posts.map((post) => {
            const canDelete = post.organization.id === organizationId;

            return (
              <Card key={post.id} className='p-3'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center space-x-3'>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage
                        src={post.organization.image_url || undefined}
                        alt={post.organization.name}
                      />
                      <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white font-medium'>
                        {getInitials(post.organization.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-semibold text-sm'>
                        {post.organization.name}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {formatPostTime(post.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    {/* Verification Badge */}
                    {post.verified ? (
                      <div className='flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium border dark:border-green-800'>
                        <ShieldCheck className='h-3 w-3' />
                        {t('verified')}
                      </div>
                    ) : (
                      <div className='flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 px-2 py-1 rounded-full text-xs font-medium border dark:border-amber-800'>
                        <Clock3 className='h-3 w-3' />
                        {t('pending')}
                      </div>
                    )}
                    {/* Delete Button */}
                    {canDelete && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20'
                        onClick={() => handleDeleteClick(post.id)}
                        title={t('deletePost')}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                </div>

                {post.text && (
                  <div className=''>
                    <p className='text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground'>
                      {post.text}
                    </p>
                  </div>
                )}

                {renderImages(post.images)}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deletePostTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deletePostDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleting ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Gallery */}
      <ImageGallery
        images={galleryImages}
        isOpen={galleryOpen}
        initialIndex={galleryInitialIndex}
        onClose={closeGallery}
      />
    </>
  );
}
