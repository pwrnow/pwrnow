'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useState } from 'react';
import Image from 'next/image';
import { Dropzone } from '@/components/ui/dropzone';

const eventFormSchema = z.object({
  title: z.string().min(1, 'Tytuł jest wymagany'),
  startDate: z.string().min(1, 'Data rozpoczęcia jest wymagana'),
  endDate: z.string().min(1, 'Data zakończenia jest wymagana'),
  location: z.string().min(1, 'Lokalizacja jest wymagana'),
  description: z.string().optional(),
  facebookEventUrl: z
    .string()
    .url('Musi być prawidłowym adresem URL')
    .optional(),
  image: z.any().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface AddEventFormProps {
  organizationId: string;
}

export default function AddEventForm({ organizationId }: AddEventFormProps) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      startDate: '',
      endDate: '',
      location: '',
      description: '',
      facebookEventUrl: '',
    },
  });

  const onSubmit = async (data: EventFormValues) => {
    // TODO: Implement event submission
    console.log(data);
  };

  const handleImageDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      form.setValue('image', file);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tytuł wydarzenia</FormLabel>
              <FormControl>
                <Input placeholder='Wprowadź tytuł wydarzenia' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Zdjęcie wydarzenia</FormLabel>
          <FormControl>
            <Dropzone onDrop={handleImageDrop} className='h-48' />
          </FormControl>
        </FormItem>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='startDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data i godzina rozpoczęcia</FormLabel>
                <FormControl>
                  <Input type='datetime-local' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='endDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data i godzina zakończenia</FormLabel>
                <FormControl>
                  <Input type='datetime-local' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='location'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lokalizacja</FormLabel>
              <FormControl>
                <Input
                  placeholder='Wprowadź lokalizację wydarzenia'
                  {...field}
                />
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
              <FormLabel>Opis (opcjonalnie)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Wprowadź opis wydarzenia'
                  className='resize-none'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='facebookEventUrl'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Link do wydarzenia na Facebooku (opcjonalnie)
              </FormLabel>
              <FormControl>
                <Input
                  type='url'
                  placeholder='https://facebook.com/events/...'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' className='w-full'>
          Utwórz wydarzenie
        </Button>
      </form>
    </Form>
  );
}
