'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { cn, formatEventDateRange, formatEventTimeRange } from '@/lib/utils';
import type { Event } from '@/lib/types';
import { CATEGORY_SLUGS } from '@/lib/constants';
import { useAnalytics } from '@/lib/useAnalytics';
import { useTranslations, useLocale } from 'next-intl';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const { trackEventClick, trackEventInteraction } = useAnalytics();
  const t = useTranslations('EventCard');
  const locale = useLocale();

  // Use utility functions for consistent date/time formatting
  const dateString = formatEventDateRange(
    event.starts_at,
    event.ends_at,
    locale
  );
  const timeString = formatEventTimeRange(event.starts_at, event.ends_at);

  const organizationName = event.organization?.name || t('defaultOrganization');
  const organizationImageUrl = event.organization?.image_url;
  const categoryName = event.category.name;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  const orgInitials = getInitials(organizationName);
  const handleMapLinkClick = () => {
    if (!event.location) return;

    // Track map click with organization info
    trackEventInteraction(
      'map_click',
      event.id,
      event.title,
      event.organization?.id,
      event.organization?.name
    );

    const isIOS =
      typeof navigator !== 'undefined' &&
      /iPad|iPhone|iPod/.test(navigator.userAgent);
    const encodedLocation = encodeURIComponent(event.location);
    const mapsUrl = isIOS
      ? `maps://?q=${encodedLocation}`
      : `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    window.open(mapsUrl, '_blank');
  };

  const handleEventLinkClick = () => {
    // Track event link click with organization info
    trackEventClick(
      event.id,
      event.title,
      event.organization?.id,
      event.organization?.name
    );
  };
  const truncateDescription = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div className='mb-8 border-0 sm:border sm:rounded-lg sm:shadow-sm hover:sm:shadow-md transition-all duration-300 overflow-hidden group'>
      {/* Hidden SEO-friendly link to event detail page */}
      <Link
        href={`/wydarzenia/${event.slug}`}
        className='sr-only'
        aria-label={`View details for ${event.title}`}
      >
        {event.title} - {event.organization.name} - {dateString}
      </Link>
      <div className='flex flex-col'>
        <div className='px-3 py-2 sm:px-4 sm:py-3 flex items-center space-x-2 sm:space-x-3'>
          <Avatar className='h-8 w-8 sm:h-10 sm:w-10 border border-primary/20 ring-offset-background transition-all duration-300 group-hover:shadow-sm'>
            {organizationImageUrl ? (
              <Image
                src={organizationImageUrl}
                alt={organizationName}
                fill
                className='object-cover rounded-full'
                sizes='(max-width: 640px) 32px, 40px'
              />
            ) : (
              <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white font-medium'>
                {orgInitials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className='flex-1'>
            <div className='flex items-center justify-between'>
              <span className='font-medium text-sm sm:text-base leading-tight break-words max-w-[60%]'>
                {organizationName}
              </span>
              <div className='flex items-center gap-2'>
                {event.category && (
                  <Badge
                    variant='outline'
                    className={cn(
                      'bg-gradient-to-r from-primary/20 to-secondary/20 text-xs sm:text-sm',
                      event.category.slug === CATEGORY_SLUGS.REKRUTACJA
                        ? 'border-amber-500'
                        : 'border-primary/50'
                    )}
                  >
                    {categoryName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        {event.category?.slug === CATEGORY_SLUGS.REKRUTACJA ? null : (
        <div
          className={cn(
            'relative w-full overflow-hidden bg-gray-100 dark:bg-gray-900',
            event.aspect_ratio === '1:1' ? 'aspect-square' : 'aspect-[16/9]',
            isImageLoading && 'animate-pulse'
          )}
        >
          <Image
            src={event.image_url || '/placeholder.svg'}
            alt={event.title}
            fill
            className={cn(
              'object-cover transition-transform duration-500 z-10',
              isImageLoading && 'opacity-0'
            )}
            sizes='(max-width: 640px) 100vw, (max-width: 768px) 540px, (max-width: 1024px) 680px, 768px'
            priority
            onLoad={() => {
              setIsImageLoading(false);
            }}
          />
        </div>
        )}
        <div className='px-3 pt-3 sm:px-4 sm:pt-4 pb-4 sm:pb-6'>
          <h2 className='text-lg sm:text-xl md:text-2xl font-bold display-font mb-2 sm:mb-3'>
            {event.title}
          </h2>
          <div className='flex flex-col space-y-2 mb-3 sm:mb-4 text-xs sm:text-sm'>
            <div className='flex items-center'>
              <div className='p-1.5 rounded-md bg-blue-100 dark:bg-blue-950 mr-2 flex-shrink-0'>
                <Calendar className='h-4 w-4 sm:h-5 sm:w-5 text-blue-500 dark:text-blue-400' />
              </div>
              <span className='font-medium'>{dateString}</span>
            </div>
            <div className='flex items-center'>
              <div className='p-1.5 rounded-md bg-purple-100 dark:bg-purple-950 mr-2 flex-shrink-0'>
                <Clock className='h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400' />
              </div>
              <span className='font-medium'>{timeString}</span>
            </div>
            {event.location && (
              <div className='flex items-center'>
                <div className='p-1.5 rounded-md bg-red-100 dark:bg-red-950 mr-2 flex-shrink-0'>
                  <MapPin className='h-4 w-4 sm:h-5 sm:w-5 text-red-500 dark:text-red-400' />
                </div>
                <button
                  onClick={handleMapLinkClick}
                  className='font-medium hover:underline flex items-center gap-1 cursor-pointer'
                  title={t('openInMaps')}
                >
                  {event.location}
                  <ExternalLink className='h-3 w-3' />
                </button>
              </div>
            )}
          </div>
          {event.description && (
            <div className='text-muted-foreground leading-relaxed text-xs sm:text-sm mb-3 sm:mb-4'>
              <div
                className={cn(
                  'relative',
                  !isDescriptionExpanded &&
                    event.description.length > 200 &&
                    'after:absolute after:bottom-0 after:left-0 after:h-8 after:w-full after:bg-gradient-to-b after:from-transparent after:to-background'
                )}
              >
                <p className='whitespace-pre-wrap break-words'>
                  {isDescriptionExpanded
                    ? event.description
                    : truncateDescription(event.description, 200)}
                </p>
              </div>
              {event.description.length > 200 && (
                <Button
                  variant='link'
                  size='sm'
                  className='mt-1 h-auto p-0 text-primary cursor-pointer'
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                >
                  {isDescriptionExpanded ? t('showLess') : t('showMore')}
                </Button>
              )}
            </div>
          )}
          {event.url && (
            <div className='mt-3'>
              <Link
                href={event.url}
                target='_blank'
                rel='noopener noreferrer'
                onClick={handleEventLinkClick}
              >
                <Button
                  variant='default'
                  size='sm'
                  className='w-full flex items-center gap-2 transition-all duration-300 cursor-pointer'
                >
                  <ExternalLink className='h-4 w-4' />
                  {event.category?.slug === CATEGORY_SLUGS.REKRUTACJA
                    ? t('openRecruitmentForm')
                    : t('visitEventPage')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className='h-px bg-border sm:hidden mt-2 mb-2'></div>
    </div>
  );
}
