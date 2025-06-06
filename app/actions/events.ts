'use server';

import { createClient } from '@/utils/supabase/server';
import { createPublicClient } from '@/utils/supabase/public';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import {
  eventServerSchema,
  EventServerParams,
  eventVerificationSchema,
  eventDeleteSchema,
} from '@/lib/schemas/event';
import { requireAdmin } from '@/utils/auth';
import { z } from 'zod';

// Define Event type to be shared across components
export interface Event {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  image_url: string | null;
  url: string | null;
  verified?: boolean;
  organization?: {
    id: string;
    name: string;
    image_url: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface CreateEventParams extends EventServerParams {
  imageFile: File | null;
}

// Note: The File type here requires special handling since it's coming from the client
// In a production environment, you might need to use FormData to handle file uploads
export async function createEvent(params: CreateEventParams) {
  try {
    // Validate input with Zod
    const validationResult = eventServerSchema.safeParse(params);

    if (!validationResult.success) {
      // Extract and format the first error message
      const errorMessage =
        validationResult.error.errors[0]?.message ||
        'Nieprawidłowe dane formularza';

      return {
        success: false,
        error: errorMessage,
      };
    }

    const {
      title,
      startsAt,
      endsAt,
      location,
      description,
      categoryId,
      organizationId,
      imageFile,
      url,
      orgCode,
    } = params;

    // Initialize Supabase client
    const supabase = await createClient();

    // Validate image size if provided
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'Rozmiar obrazka nie może przekraczać 5MB',
      };
    }

    // Default event data with url field
    const eventData = {
      title,
      starts_at: startsAt,
      ends_at: endsAt,
      location,
      description,
      category_id: categoryId,
      organization_id: organizationId,
      verified: false,
      image_url: null as string | null,
      url,
    };

    // Handle image upload if provided
    if (imageFile) {
      try {
        // Ensure storage bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const eventImagesBucket = buckets?.find(
          (bucket) => bucket.name === 'event-images'
        );

        if (!eventImagesBucket) {
          // Create bucket if it doesn't exist
          const { error: createBucketError } =
            await supabase.storage.createBucket('event-images', {
              public: true,
              fileSizeLimit: 5242880, // 5MB
            });

          if (createBucketError) {
            console.error('Error creating bucket:', createBucketError);
            // Continue anyway, as the bucket might exist but not be visible
          }
        }

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await imageFile.arrayBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer);

        // Generate a unique filename
        const fileExtension = imageFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExtension}`;
        const filePath = `events/${fileName}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(filePath, fileBuffer, {
            contentType: imageFile.type,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          if (uploadError.message.includes('exceeded')) {
            return {
              success: false,
              error: 'Rozmiar obrazka nie może przekraczać 5MB',
            };
          }
          throw new Error(
            `Błąd podczas przesyłania obrazka: ${uploadError.message}`
          );
        }

        // Get public URL for the uploaded image
        const {
          data: { publicUrl },
        } = supabase.storage.from('event-images').getPublicUrl(filePath);

        // Add image URL to event data
        eventData.image_url = publicUrl;
      } catch (error) {
        console.error('Error processing image:', error);
        return {
          success: false,
          error:
            'Wystąpił problem z przetwarzaniem obrazka. Spróbuj ponownie lub użyj innego obrazka.',
        };
      }
    }

    // Insert event into database
    try {
      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select('id')
        .single();

      if (error) {
        console.error('Database error:', error);

        if (error.code === '23505') {
          return {
            success: false,
            error: 'Wydarzenie o takich parametrach już istnieje',
          };
        }

        if (error.code === '23503') {
          return {
            success: false,
            error: 'Wybrana kategoria lub organizacja nie istnieje',
          };
        }

        return {
          success: false,
          error: `Błąd podczas zapisywania wydarzenia: ${error.message}`,
        };
      }

      // Revalidate the organization page and cache
      revalidatePath(`/${orgCode}`);
      revalidatePath('/');
      revalidateTag('events');

      return { success: true, eventId: data.id };
    } catch (dbError) {
      console.error('Error inserting event:', dbError);
      return {
        success: false,
        error: 'Wystąpił błąd podczas zapisywania wydarzenia w bazie danych',
      };
    }
  } catch (error) {
    console.error('Error in createEvent:', error);
    return {
      success: false,
      error:
        'Wystąpił nieoczekiwany błąd podczas tworzenia wydarzenia. Spróbuj ponownie później.',
    };
  }
}

export async function deleteEvent(eventId: string, organizationId: string) {
  try {
    const supabase = await createClient();

    // First verify that this event belongs to the organization
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organization_id', organizationId)
      .single();

    if (!event) {
      return {
        success: false,
        error: 'Nie znaleziono wydarzenia lub nie masz uprawnień do usunięcia',
      };
    }

    // Delete the event
    const { error } = await supabase.from('events').delete().eq('id', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      return { success: false, error: error.message };
    }

    // Revalidate the organization page and cache
    revalidatePath(`/${organizationId}`);
    revalidatePath('/');
    revalidateTag('events');

    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    return {
      success: false,
      error: 'Wystąpił błąd podczas usuwania wydarzenia',
    };
  }
}

// Cached category map to avoid repeated slug-to-id lookups
const getCategoryIdFromSlug = unstable_cache(
  async (slug: string): Promise<string | null> => {
    const supabase = createPublicClient();

    const { data } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    return data?.id || null;
  },
  ['category-slug'],
  {
    tags: ['categories'],
    revalidate: 3600, // Cache for 1 hour
  }
);

// Cache the event fetching to improve performance
export const getEvents = unstable_cache(
  async (categorySlug?: string): Promise<Event[]> => {
    const supabase = createPublicClient();

    let query = supabase
      .from('events')
      .select(
        `
      *,
      organization:organizations(*),
      category:categories(*)
    `
      )
      .gte('ends_at', new Date().toISOString())
      .eq('verified', true);

    // Filter by category at the database level if a category is specified
    if (categorySlug && categorySlug !== 'wszystkie') {
      // Filter events that have a category with matching slug
      query = query
        .not('category', 'is', null) // Ensure category exists
        .eq('category.slug', categorySlug);
    }

    // Apply sorting
    query = query.order('starts_at', { ascending: true });

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    return events || [];
  },
  ['events'],
  {
    tags: ['events'],
    revalidate: 3600, // Cache for 1 hour
  }
);

export async function updateEventStatus(formData: FormData) {
  await requireAdmin();

  try {
    const validatedData = eventVerificationSchema.parse({
      eventId: formData.get('eventId'),
      verified: formData.get('verified'),
    });

    const supabase = await createClient();
    const { error } = await supabase
      .from('events')
      .update({ verified: validatedData.verified })
      .eq('id', validatedData.eventId);

    if (error) {
      throw new Error(`Błąd podczas aktualizacji statusu: ${error.message}`);
    }

    revalidatePath('/admin/events');
    revalidatePath('/');
    revalidateTag('events');
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    throw error instanceof Error
      ? error
      : new Error('Błąd podczas aktualizacji statusu wydarzenia');
  }
}

export async function adminDeleteEvent(eventId: string) {
  await requireAdmin();

  try {
    const validatedData = eventDeleteSchema.parse({ eventId });

    const supabase = await createClient();
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', validatedData.eventId);

    if (error) {
      throw new Error(`Błąd podczas usuwania wydarzenia: ${error.message}`);
    }

    revalidatePath('/admin/events');
    revalidatePath('/');
    revalidateTag('events');
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    throw error instanceof Error
      ? error
      : new Error('Błąd podczas usuwania wydarzenia');
  }
}
