'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalytics } from '@/lib/useAnalytics';

export default function WlepaPage() {
  const router = useRouter();
  const { safeCapture } = useAnalytics();

  useEffect(() => {
    const isIOS = () => {
      return (
        [
          'iPad Simulator',
          'iPhone Simulator',
          'iPod Simulator',
          'iPad',
          'iPhone',
          'iPod',
        ].includes(navigator.platform) ||
        // iPad on iOS 13 detection
        (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
      );
    };

    const isiOSDevice = isIOS();

    // Track the visit
    safeCapture('wlepa_page_visited', {
      is_ios: isiOSDevice,
      user_agent: navigator.userAgent,
      platform: navigator.platform,
    });

    // Redirect iOS users to /aplikacja
    if (isiOSDevice) {
      safeCapture('wlepa_redirect_to_app', {
        from: '/wlepa',
        to: '/aplikacja',
        reason: 'iOS device detected',
      });
      router.push('/aplikacja');
    } else {
      // Redirect non-iOS users to home
      safeCapture('wlepa_redirect_to_home', {
        from: '/wlepa',
        to: '/',
        reason: 'Non-iOS device',
      });
      router.push('/');
    }
  }, [router, safeCapture]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-background'>
      <div className='text-center space-y-4 animate-pulse'>
        <div className='w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto' />
        <p className='text-muted-foreground'>Redirecting...</p>
      </div>
    </div>
  );
}

