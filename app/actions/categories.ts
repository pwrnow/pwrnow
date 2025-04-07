'use server';

import { createClient } from '@/utils/supabase/server';
import { cache } from 'react';

export const getCategories = cache(async () => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name');

    if (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in getCategories:', error);
    return [];
  }
});
