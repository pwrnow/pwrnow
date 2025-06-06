import { createServerClient } from '@supabase/ssr';

// Public client for static data that doesn't require authentication
// This client doesn't use cookies, allowing routes to be statically rendered
export const createPublicClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op for static rendering
        },
      },
    }
  );
};
