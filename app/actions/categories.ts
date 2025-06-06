'use server';

import { createPublicClient } from '@/utils/supabase/public';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

export const getCategories = unstable_cache(
  async () => {
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');

      if (error) {
        throw new Error(`Error fetching categories: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
    }
  },
  ['categories'],
  {
    tags: ['categories'],
    revalidate: 86400, // Cache for 1 day (24 hours)
  }
);
