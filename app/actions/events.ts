'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface CreateEventParams {
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  description: string | null;
  categoryId: string;
  organizationId: string;
  imageFile: File | null;
  url: string | null;
  orgCode: string;
}

// Note: The File type here requires special handling since it's coming from the client
// In a production environment, you might need to use FormData to handle file uploads
export async function createEvent(params: CreateEventParams) {
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

  try {
    // Initialize Supabase client
    const supabase = await createClient();

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
        throw new Error(`Error uploading image: ${uploadError.message}`);
      }

      // Get public URL for the uploaded image
      const {
        data: { publicUrl },
      } = supabase.storage.from('event-images').getPublicUrl(filePath);

      // Add image URL to event data
      eventData.image_url = publicUrl;
    }

    // Insert event into database
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Error creating event: ${error.message}`);
    }

    // Revalidate the organization page
    revalidatePath(`/${orgCode}`);

    return { success: true, eventId: data.id };
  } catch (error) {
    console.error('Error in createEvent:', error);
    return { success: false, error: (error as Error).message };
  }
}
