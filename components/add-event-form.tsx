'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/app/actions/events';

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

const formSchema = z.object({
  title: z.string().min(1, {
    message: 'Tytuł jest wymagany',
  }),
  categoryId: z.string().uuid({
    message: 'Wybierz kategorię',
  }),
  startsAt: z.date({
    required_error: 'Wybierz datę i czas rozpoczęcia',
  }),
  endsAt: z.date({
    required_error: 'Wybierz datę i czas zakończenia',
  }),
  location: z.string().min(1, {
    message: 'Lokalizacja jest wymagana',
  }),
  description: z.string().optional(),
  url: z
    .string()
    .url({ message: 'Podaj prawidłowy adres URL' })
    .optional()
    .or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface AddEventFormProps {
  organizationId: string;
  orgCode: string;
  categories: Category[];
}

export default function AddEventForm({
  organizationId,
  orgCode,
  categories,
}: AddEventFormProps) {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      categoryId: '',
      location: '',
      description: '',
      url: '',
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      setIsSubmitting(true);

      // Call server action
      await createEvent({
        title: data.title,
        startsAt: data.startsAt.toISOString(),
        endsAt: data.endsAt.toISOString(),
        location: data.location,
        description: data.description || null,
        categoryId: data.categoryId,
        organizationId,
        imageFile,
        url: data.url || null,
        orgCode: orgCode,
      });

      // Navigate back to organization page
      router.push(`/${organizationId}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating event:', error);
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
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tytuł</FormLabel>
              <FormControl>
                <Input placeholder='Nazwa wydarzenia' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='categoryId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Wybierz kategorię' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value='none' disabled>
                      Brak dostępnych kategorii
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
                <FormLabel>Data i czas rozpoczęcia</FormLabel>
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
                          <span>Wybierz datę i czas</span>
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
                        <p className='mb-2 text-sm'>Wybierz czas:</p>
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
                <FormLabel>Data i czas zakończenia</FormLabel>
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
                          <span>Wybierz datę i czas</span>
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
                        <p className='mb-2 text-sm'>Wybierz czas:</p>
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

        <FormItem>
          <FormLabel>Zdjęcie</FormLabel>
          <Dropzone
            className='mt-2'
            onDrop={(acceptedFiles) => {
              setImageFile(acceptedFiles[0]);
            }}
          />
          {imageFile && (
            <p className='text-sm mt-2'>
              Wybrano: {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)
            </p>
          )}
        </FormItem>

        <FormField
          control={form.control}
          name='location'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lokalizacja</FormLabel>
              <FormControl>
                <Input
                  placeholder='Gdzie odbędzie się wydarzenie?'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='url'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link do wydarzenia</FormLabel>
              <FormControl>
                <Input placeholder='https://...' type='url' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opis</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Opisz swoje wydarzenie (opcjonalnie)'
                  className='min-h-[120px]'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' className='w-full' disabled={isSubmitting}>
          {isSubmitting ? 'Zapisywanie...' : 'Utwórz wydarzenie'}
        </Button>
      </form>
    </Form>
  );
}
