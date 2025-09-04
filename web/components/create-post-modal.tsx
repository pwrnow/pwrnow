'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Upload, ImageIcon, Grip, Trash2 } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Post } from '@/lib/types';
import { createPost } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const createPostSchema = z
  .object({
    text: z.string().optional(),
    images: z.array(z.instanceof(File)).optional(),
  })
  .refine(
    (data) => {
      return (
        (data.text && data.text.trim().length > 0) ||
        (data.images && data.images.length > 0)
      );
    },
    {
      message: 'Post must include either text or at least one image',
      path: ['text'],
    }
  );

type CreatePostFormData = z.infer<typeof createPostSchema>;

interface ImageItem {
  id: string;
  file: File;
  preview: string;
}

interface SortableImageItemProps {
  image: ImageItem;
  onRemove: (id: string) => void;
}

function SortableImageItem({ image, onRemove }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='relative group bg-card border rounded-lg overflow-hidden'
    >
      <div className='aspect-square relative'>
        <Image
          src={image.preview}
          alt='Preview'
          fill
          className='object-cover'
        />

        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className='absolute top-2 left-2 cursor-grab active:cursor-grabbing bg-black/50 hover:bg-black/70 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity'
        >
          <Grip className='h-4 w-4' />
        </div>

        {/* Remove Button */}
        <Button
          type='button'
          variant='destructive'
          size='sm'
          className='absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
          onClick={() => onRemove(image.id)}
        >
          <X className='h-3 w-3' />
        </Button>
      </div>
    </div>
  );
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
  eventSlug: string;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
  eventSlug,
}: CreatePostModalProps) {
  const t = useTranslations('CreatePostModal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const form = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      text: '',
      images: [],
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles: 10,
    onDrop: (acceptedFiles) => {
      const newImages = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
      }));
      setImages((prev) => [...prev, ...newImages]);

      // Update form data
      const allFiles = [...images.map((img) => img.file), ...acceptedFiles];
      form.setValue('images', allFiles);
    },
  });

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      // Update form data
      form.setValue(
        'images',
        updated.map((img) => img.file)
      );
      return updated;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);

        // Update form data
        form.setValue(
          'images',
          reordered.map((img) => img.file)
        );
        return reordered;
      });
    }
  };

  const onSubmit = async (data: CreatePostFormData) => {
    setIsSubmitting(true);

    try {
      const postData = {
        event_slug: eventSlug,
        text: data.text?.trim() || undefined,
        images: images.map((img) => img.file),
      };

      const newPost = await createPost(postData);
      onPostCreated(newPost);
      toast.success(t('postCreated'));

      // Reset form and close modal
      form.reset();
      setImages([]);
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error(t('createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setImages([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle>{t('createNewPost')}</DialogTitle>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto pr-2'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              {/* Text Content */}
              <FormField
                control={form.control}
                name='text'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('postContent')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('postContentPlaceholder')}
                        className='min-h-[120px] resize-none'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload */}
              <div className='space-y-4'>
                <Label>{t('images')}</Label>

                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className='flex flex-col items-center space-y-2'>
                    <Upload className='h-8 w-8 text-muted-foreground' />
                    <div className='text-sm text-muted-foreground'>
                      {isDragActive ? (
                        <p>{t('dropImages')}</p>
                      ) : (
                        <div>
                          <p>{t('dragImagesOrClick')}</p>
                          <p className='text-xs mt-1'>
                            {t('supportedFormats')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Image Preview Grid */}
                {images.length > 0 && (
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium'>
                      {t('imagePreview')}
                    </Label>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={images.map((img) => img.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
                          {images.map((image) => (
                            <SortableImageItem
                              key={image.id}
                              image={image}
                              onRemove={handleRemoveImage}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                    <p className='text-xs text-muted-foreground'>
                      {t('dragToReorder')}
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className='flex justify-end space-x-2 pt-4 border-t'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='min-w-[100px]'
                >
                  {isSubmitting ? t('creating') : t('createPost')}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
