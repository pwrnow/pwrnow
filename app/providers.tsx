'use client';

import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { PostHogProvider } from '@/components/posthog-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <PostHogProvider>{children}</PostHogProvider>
      <Toaster />
    </>
  );
}
