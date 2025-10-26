'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalytics } from '@/lib/useAnalytics';

export default function WlepaPage() {
  const router = useRouter();
  const { trackEvent } = useAnalytics();

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
    trackEvent('wlepa_page_visited', {
      'Is iOS': isiOSDevice,
      'User Agent': navigator.userAgent,
      'Platform': navigator.platform,
    });

    // Redirect iOS users to /aplikacja
    if (isiOSDevice) {
      trackEvent('wlepa_redirect_to_app', {
        'From': '/wlepa',
        'To': '/aplikacja',
        'Reason': 'iOS device detected',
      });
      router.push('/aplikacja');
    } else {
      // Redirect non-iOS users to home
      trackEvent('wlepa_redirect_to_home', {
        'From': '/wlepa',
        'To': '/',
        'Reason': 'Non-iOS device',
      });
      router.push('/');
    }
  }, [router, trackEvent]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-background'>
      <div className='text-center space-y-4 animate-pulse'>
        <div className='w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto' />
        <p className='text-muted-foreground'>Redirecting...</p>
      </div>
    </div>
  );
}

