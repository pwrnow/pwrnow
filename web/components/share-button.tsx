'use client';

import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createEventPublicUrl } from '@/lib/url-utils';
import { useAnalytics } from '@/lib/useAnalytics';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useState, useCallback, useRef } from 'react';
import type { Event } from '@/lib/types';

interface ShareButtonProps {
  event: Pick<
    Event,
    | 'id'
    | 'slug'
    | 'title'
    | 'starts_at'
    | 'ends_at'
    | 'image_url'
    | 'aspect_ratio'
    | 'is_new'
  > & {
    category: { slug: string; name: string };
    organization: { id?: string | null; name: string };
  };
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'default' | 'icon';
  className?: string;
}

export default function ShareButton({
  event,
  variant = 'ghost',
  size = 'icon',
  className = '',
}: ShareButtonProps) {
  const t = useTranslations('ShareButton');
  const { trackEventShareClicked } = useAnalytics();
  const [copied, setCopied] = useState(false);
  const isProcessing = useRef(false);

  const handleShare = useCallback(async () => {
    // Prevent double-clicks
    if (isProcessing.current || copied) return;
    isProcessing.current = true;

    const shareUrl = createEventPublicUrl(event.slug);

    // Track share event
    trackEventShareClicked(event);

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t('linkCopied'), {
        description: t('linkCopiedDescription'),
        duration: 2000,
      });
      setTimeout(() => {
        setCopied(false);
        isProcessing.current = false;
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error(t('copyFailed'));
      isProcessing.current = false;
    }
  }, [event, trackEventShareClicked, copied, t]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={className}
      title={t('shareEvent')}
      aria-label={t('shareEvent')}
      disabled={copied}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  );
}
