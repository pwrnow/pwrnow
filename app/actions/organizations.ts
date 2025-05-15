'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

interface UpdateOrganizationImageParams {
  orgCode: string;
  imageFile: File | null;
}

export async function updateOrganizationImage({
  orgCode,
  imageFile,
}: UpdateOrganizationImageParams) {
  try {
    // Initialize Supabase client
    const supabase = await createClient();

    // Check if organization exists
    const { data: organization } = await supabase
      .from('organizations')
      .select('id')
      .eq('code', orgCode)
      .single();

    if (!organization) {
      return {
        success: false,
        error: 'Nie znaleziono organizacji',
      };
    }

    // If no image file is provided, skip upload
    if (!imageFile) {
      return {
        success: false,
        error: 'Nie wybrano obrazka',
      };
    }

    // Validate image size
    if (imageFile.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'Rozmiar obrazka nie może przekraczać 5MB',
      };
    }

    // Handle image upload
    try {
      // Ensure storage bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const orgImagesBucket = buckets?.find(
        (bucket) => bucket.name === 'organization-images'
      );

      if (!orgImagesBucket) {
        // Create bucket if it doesn't exist
        const { error: createBucketError } =
          await supabase.storage.createBucket('organization-images', {
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
      const filePath = `${orgCode}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('organization-images')
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
      } = supabase.storage.from('organization-images').getPublicUrl(filePath);

      // Update organization with new image URL
      const { error } = await supabase
        .from('organizations')
        .update({ image_url: publicUrl })
        .eq('id', organization.id);

      if (error) {
        console.error('Error updating organization:', error);
        return {
          success: false,
          error: `Błąd podczas aktualizacji organizacji: ${error.message}`,
        };
      }

      // Revalidate the organization page
      revalidatePath(`/${orgCode}`);

      return { success: true };
    } catch (error) {
      console.error('Error processing image:', error);
      return {
        success: false,
        error:
          'Wystąpił problem z przetwarzaniem obrazka. Spróbuj ponownie lub użyj innego obrazka.',
      };
    }
  } catch (error) {
    console.error('Error in updateOrganizationImage:', error);
    return {
      success: false,
      error:
        'Wystąpił nieoczekiwany błąd podczas aktualizacji obrazka organizacji. Spróbuj ponownie później.',
    };
  }
}
