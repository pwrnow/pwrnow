import { Award, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface EventBadgeProps {
  variant: 'new' | 'today';
  className?: string;
}

export function EventBadge({ variant, className }: EventBadgeProps) {
  const t = useTranslations('EventBadge');
  const baseStyles =
    'inline-flex items-center rounded-2xl border px-2 py-1 text-xs font-semibold gap-1 shadow-[0_2px_4px_rgba(124,58,237,0.1)]';

  if (variant === 'new') {
    return (
      <span
        className={cn(
          baseStyles,
          'border-primary/30 bg-primary/15 text-primary',
          className
        )}
      >
        <Award className='size-3' />
        {t('new')}
      </span>
    );
  }

  return (
    <span
      className={cn(
        baseStyles,
        'border-accent/30 bg-accent/15 text-accent',
        className
      )}
    >
      <Zap className='size-3' />
      {t('today')}
    </span>
  );
}
