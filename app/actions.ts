'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

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

    // Revalidate the organization page
    revalidatePath(`/${organizationId}`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    return {
      success: false,
      error: 'Wystąpił błąd podczas usuwania wydarzenia',
    };
  }
}
