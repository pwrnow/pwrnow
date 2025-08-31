'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  eventFormSchema,
  EventFormValues,
  formToApiData,
} from '@/lib/schemas/event';
import { createEvent } from '@/lib/api';
import { Category } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Dropzone } from '@/components/ui/dropzone';
import { useTranslations } from 'next-intl';

interface AddEventFormProps {
  organizationCode: string;
  categories: Category[];
}

export default function AddEventForm({
  organizationCode,
  categories,
}: AddEventFormProps) {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const t = useTranslations('AddEventForm');

  // Create a unique storage key for this organization
  const storageKey = `add-event-form-${organizationCode}`;
  const imageStorageKey = `add-event-image-${organizationCode}`;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      categorySlug: '',
      location: '',
      description: '',
      url: '',
    },
  });

  // Load saved form data on component mount
  useEffect(() => {
    try {
      const savedFormData = localStorage.getItem(storageKey);
      if (savedFormData) {
        const parsedData = JSON.parse(savedFormData);

        // Convert date strings back to Date objects
        if (parsedData.startsAt) {
          parsedData.startsAt = new Date(parsedData.startsAt);
        }
        if (parsedData.endsAt) {
          parsedData.endsAt = new Date(parsedData.endsAt);
        }

        // Set the form values
        form.reset(parsedData);
      }

      // Restore saved image if exists
      const savedImageData = localStorage.getItem(imageStorageKey);
      if (savedImageData) {
        try {
          const parsedImageData = JSON.parse(savedImageData);

          if (parsedImageData.base64 && !parsedImageData.tooLarge) {
            // Restore full image from base64
            const restoredFile = base64ToFile(
              parsedImageData.base64,
              parsedImageData.name,
              parsedImageData.type
            );
            setImageFile(restoredFile);
          } else if (parsedImageData.tooLarge) {
            // Show info about large image that couldn't be persisted
            setImageError(
              t('largeImageWarning', {
                name: parsedImageData.name,
                size: parsedImageData.size,
              })
            );
          }
        } catch (error) {
          console.error('Error restoring image:', error);
          localStorage.removeItem(imageStorageKey);
        }
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
      // Clear corrupted data
      localStorage.removeItem(storageKey);
      localStorage.removeItem(imageStorageKey);
    }
    setIsFormLoaded(true);
  }, [form, storageKey, imageStorageKey, t]);

  // Watch form values and save to localStorage with debounce
  const watchedValues = form.watch();
  useEffect(() => {
    if (!isFormLoaded) return; // Don't save during initial load

    const timeoutId = setTimeout(() => {
      try {
        // Only save if there's actual data (not just empty strings)
        const hasData = Object.values(watchedValues).some(
          (value) => value !== '' && value !== undefined && value !== null
        );

        if (hasData) {
          localStorage.setItem(storageKey, JSON.stringify(watchedValues));
        }
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [watchedValues, storageKey, isFormLoaded]);

  // Helper functions for image persistence
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const base64ToFile = (
    base64: string,
    filename: string,
    mimeType: string
  ): File => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: mimeType });
  };

  // Clear saved data helper function
  const clearSavedData = () => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(imageStorageKey);
    } catch (error) {
      console.error('Error clearing saved data:', error);
    }
  };

  async function onSubmit(data: EventFormValues) {
    try {
      // Validate image size if an image is uploaded
      if (imageFile && imageFile.size > 5 * 1024 * 1024) {
        setImageError(t('imageSizeError'));
        return;
      }

      setIsSubmitting(true);
      setImageError(null);
      setFormError(null);

      // Transform form data to API format
      const apiData = formToApiData(data, imageFile);

      // Call API
      const result = await createEvent(apiData);

      if (result) {
        // Clear saved form data on successful submission
        clearSavedData();

        // Navigate back to organization page
        router.push(`/org/${organizationCode}`);
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating event:', error);
      if (error instanceof Error) {
        if (
          error.message.includes('image') ||
          error.message.includes('obrazk')
        ) {
          setImageError(error.message);
        } else {
          setFormError(error.message || t('defaultError'));
        }
      } else {
        setFormError(t('unexpectedError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helper function to create a date with time
  const setTimeForDate = (date: Date, hours: number, minutes: number) => {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes);
    return newDate;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {formError && (
          <div className='p-3 bg-destructive/15 border border-destructive text-destructive rounded-md'>
            <p>{formError}</p>
          </div>
        )}

        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('title')}</FormLabel>
              <FormControl>
                <Input placeholder={t('titlePlaceholder')} {...field} />
              </FormControl>
              <div className='flex justify-between'>
                <FormMessage />
                <p className='text-xs text-muted-foreground'>
                  {(field.value && field.value.length) || 0}/100
                </p>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='categorySlug'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('category')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('categoryPlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value='none' disabled>
                      {t('noCategoriesAvailable')}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <FormField
            control={form.control}
            name='startsAt'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>{t('startDate')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPp')
                        ) : (
                          <span>{t('selectDateAndTime')}</span>
                        )}
                        <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <div className='p-3'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            // Preserve the current time if date already exists
                            const hours = field.value
                              ? field.value.getHours()
                              : 10;
                            const minutes = field.value
                              ? field.value.getMinutes()
                              : 0;
                            field.onChange(
                              setTimeForDate(date, hours, minutes)
                            );
                          } else {
                            field.onChange(date);
                          }
                        }}
                        initialFocus
                      />
                      <div className='px-4 pt-4 pb-2'>
                        <p className='mb-2 text-sm'>{t('selectTime')}:</p>
                        <div className='flex gap-2'>
                          <Select
                            value={
                              field.value
                                ? field.value.getHours().toString()
                                : '10'
                            }
                            onValueChange={(value) => {
                              if (field.value) {
                                field.onChange(
                                  setTimeForDate(
                                    field.value,
                                    parseInt(value),
                                    field.value.getMinutes()
                                  )
                                );
                              } else {
                                const now = new Date();
                                field.onChange(
                                  setTimeForDate(now, parseInt(value), 0)
                                );
                              }
                            }}
                          >
                            <SelectTrigger className='w-[70px]'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i.toString().padStart(2, '0')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className='self-center text-lg'>:</span>
                          <Select
                            value={
                              field.value
                                ? field.value.getMinutes().toString()
                                : '0'
                            }
                            onValueChange={(value) => {
                              if (field.value) {
                                field.onChange(
                                  setTimeForDate(
                                    field.value,
                                    field.value.getHours(),
                                    parseInt(value)
                                  )
                                );
                              } else {
                                const now = new Date();
                                field.onChange(
                                  setTimeForDate(now, 10, parseInt(value))
                                );
                              }
                            }}
                          >
                            <SelectTrigger className='w-[70px]'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => i * 5).map(
                                (minute) => (
                                  <SelectItem
                                    key={minute}
                                    value={minute.toString()}
                                  >
                                    {minute.toString().padStart(2, '0')}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='endsAt'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>{t('endDate')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPp')
                        ) : (
                          <span>{t('selectDateAndTime')}</span>
                        )}
                        <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <div className='p-3'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            // Preserve the current time if date already exists
                            const hours = field.value
                              ? field.value.getHours()
                              : 12;
                            const minutes = field.value
                              ? field.value.getMinutes()
                              : 0;
                            field.onChange(
                              setTimeForDate(date, hours, minutes)
                            );
                          } else {
                            field.onChange(date);
                          }
                        }}
                        initialFocus
                      />
                      <div className='px-4 pt-4 pb-2'>
                        <p className='mb-2 text-sm'>{t('selectTime')}:</p>
                        <div className='flex gap-2'>
                          <Select
                            value={
                              field.value
                                ? field.value.getHours().toString()
                                : '12'
                            }
                            onValueChange={(value) => {
                              if (field.value) {
                                field.onChange(
                                  setTimeForDate(
                                    field.value,
                                    parseInt(value),
                                    field.value.getMinutes()
                                  )
                                );
                              } else {
                                const now = new Date();
                                field.onChange(
                                  setTimeForDate(now, parseInt(value), 0)
                                );
                              }
                            }}
                          >
                            <SelectTrigger className='w-[70px]'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i.toString().padStart(2, '0')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className='self-center text-lg'>:</span>
                          <Select
                            value={
                              field.value
                                ? field.value.getMinutes().toString()
                                : '0'
                            }
                            onValueChange={(value) => {
                              if (field.value) {
                                field.onChange(
                                  setTimeForDate(
                                    field.value,
                                    field.value.getHours(),
                                    parseInt(value)
                                  )
                                );
                              } else {
                                const now = new Date();
                                field.onChange(
                                  setTimeForDate(now, 12, parseInt(value))
                                );
                              }
                            }}
                          >
                            <SelectTrigger className='w-[70px]'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => i * 5).map(
                                (minute) => (
                                  <SelectItem
                                    key={minute}
                                    value={minute.toString()}
                                  >
                                    {minute.toString().padStart(2, '0')}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Publication Date Field */}
        <FormField
          control={form.control}
          name='publicationDate'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>{t('publicationDate')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>{t('pickPublicationDate')}</span>
                      )}
                      <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date <= today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className='text-sm text-muted-foreground'>
                {t('publicationDateHelp')}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>{t('image')}</FormLabel>
          <Dropzone
            className='mt-2'
            onDrop={async (acceptedFiles) => {
              if (acceptedFiles[0].size > 5 * 1024 * 1024) {
                setImageError(t('imageSizeError'));
              } else {
                setImageError(null);
                setImageFile(acceptedFiles[0]);

                // Save full image data as base64 to localStorage
                try {
                  // Only save image to localStorage if it's reasonably small (< 2MB)
                  // to avoid localStorage size limits
                  if (acceptedFiles[0].size < 2 * 1024 * 1024) {
                    const base64 = await fileToBase64(acceptedFiles[0]);
                    const imageData = {
                      name: acceptedFiles[0].name,
                      type: acceptedFiles[0].type,
                      size: Math.round(acceptedFiles[0].size / 1024),
                      base64: base64,
                    };
                    localStorage.setItem(
                      imageStorageKey,
                      JSON.stringify(imageData)
                    );
                  } else {
                    // For larger files, just save metadata and show warning
                    const imageInfo = {
                      name: acceptedFiles[0].name,
                      size: Math.round(acceptedFiles[0].size / 1024),
                      tooLarge: true,
                    };
                    localStorage.setItem(
                      imageStorageKey,
                      JSON.stringify(imageInfo)
                    );
                  }
                } catch (error) {
                  console.error('Error saving image:', error);
                }
              }
            }}
          />
          {imageFile && !imageError && (
            <p className='text-sm mt-2'>
              {t('selectedFile', {
                name: imageFile.name,
                size: Math.round(imageFile.size / 1024),
              })}
            </p>
          )}
          {imageError && (
            <p className='text-sm mt-2 text-destructive'>{imageError}</p>
          )}
        </FormItem>

        <FormField
          control={form.control}
          name='location'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('location')}</FormLabel>
              <FormControl>
                <Input placeholder={t('locationPlaceholder')} {...field} />
              </FormControl>
              <div className='flex justify-between'>
                <FormMessage />
                <p className='text-xs text-muted-foreground'>
                  {(field.value && field.value.length) || 0}/200
                </p>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='url'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('eventLink')}</FormLabel>
              <FormControl>
                <Input placeholder='https://...' type='url' {...field} />
              </FormControl>
              <div className='flex justify-between'>
                <FormMessage />
                <p className='text-xs text-muted-foreground'>
                  {(field.value && field.value.length) || 0}/500
                </p>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('descriptionPlaceholder')}
                  className='min-h-[120px] whitespace-pre-wrap'
                  style={{ whiteSpace: 'pre-wrap' }}
                  spellCheck={true}
                  {...field}
                />
              </FormControl>
              <div className='flex justify-between'>
                <FormMessage />
                <p className='text-xs text-muted-foreground'>
                  {(field.value && field.value.length) || 0}/2000
                </p>
              </div>
            </FormItem>
          )}
        />

        <Button type='submit' className='w-full' disabled={isSubmitting}>
          {isSubmitting ? t('saving') : t('createEvent')}
        </Button>
      </form>
    </Form>
  );
}
