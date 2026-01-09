'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { cn, formatEventDateRange, formatEventTimeRange } from '@/lib/utils';
import type { Event, Organization } from '@/lib/types';
import { CATEGORY_SLUGS } from '@/lib/constants';
import { useAnalytics } from '@/lib/useAnalytics';
import { useTranslations, useLocale } from 'next-intl';
import ShareButton from '@/components/share-button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const { trackEventCtaClicked, trackEventPillClicked } = useAnalytics();
  const t = useTranslations('EventCard');
  const locale = useLocale();

  // Use utility functions for consistent date/time formatting
  const dateString = formatEventDateRange(
    event.starts_at,
    event.ends_at,
    locale
  );
  const timeString = formatEventTimeRange(event.starts_at, event.ends_at);

  // Get display name: prefer short_name, otherwise use full name
  const getDisplayName = (org: Organization | undefined) => {
    if (!org) return t('defaultOrganization');
    return org.short_name || org.display_name || org.name;
  };

  const organizationImageUrl = event.organization?.image_url;
  const categoryName = event.category.name;

  // Get all organizations (admin + co-hosts)
  const allOrganizations = event.all_organizations || [event.organization];
  const hasCoHosts = allOrganizations.length > 1;
  
  // For stacked avatars: show max 2, with +N indicator (max 3 things total)
  const visibleOrgs = allOrganizations.slice(0, 2);
  const extraOrgsCount = allOrganizations.length - 2;

  // Build organization names string with "&" separator
  const organizationNamesDisplay = allOrganizations
    .map((org) => getDisplayName(org))
    .join(' & ');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  const orgInitials = getInitials(event.organization?.name || t('defaultOrganization'));
  const handleMapLinkClick = () => {
    if (!event.location) return;

    // Track location pill click (matches mobile app)
    trackEventPillClicked(event, 'location');

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
    // Track CTA click (matches mobile app event name)
    trackEventCtaClicked(event, 'card_cta');
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
          {/* Header content - with hover popover only when multiple organizations */}
          {hasCoHosts ? (
            <HoverCard openDelay={100} closeDelay={100}>
              <HoverCardTrigger asChild>
                <div className='flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 cursor-default'>
                  {/* Stacked Avatars */}
                  <div className='flex items-center flex-shrink-0'>
                    <div className='flex items-center'>
                      {visibleOrgs.map((org, index) => (
                        <Avatar 
                          key={org.id} 
                          className={cn(
                            'h-8 w-8 sm:h-10 sm:w-10 border-2 border-background ring-offset-background transition-all duration-300 group-hover:shadow-sm',
                            index > 0 && '-ml-3'
                          )}
                          style={{ zIndex: visibleOrgs.length - index }}
                        >
                          {org.image_url ? (
                            <Image
                              src={org.image_url}
                              alt={org.name}
                              fill
                              className='object-cover rounded-full'
                              sizes='(max-width: 640px) 32px, 40px'
                            />
                          ) : (
                            <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white font-medium text-xs'>
                              {getInitials(org.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ))}
                      {extraOrgsCount > 0 && (
                        <div 
                          className='h-8 w-8 sm:h-10 sm:w-10 -ml-3 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium'
                          style={{ zIndex: 0 }}
                        >
                          +{extraOrgsCount}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Organization names and category badge */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='leading-tight line-clamp-2 flex-1 min-w-0 text-xs sm:text-sm font-medium text-foreground/80'>
                        {organizationNamesDisplay}
                      </span>
                      
                      {event.category && event.category.slug !== CATEGORY_SLUGS.REKRUTACJA && (
                        <Badge
                          variant='outline'
                          className={cn(
                            'bg-gradient-to-r from-primary/20 to-secondary/20 text-xs sm:text-sm border-primary/50 hidden sm:inline-flex flex-shrink-0'
                          )}
                        >
                          {categoryName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className='w-64 p-3' align='start' sideOffset={8}>
                <div className='space-y-2'>
                  <p className='text-xs font-medium text-muted-foreground mb-2'>
                    {t('organizedBy')}
                  </p>
                  {allOrganizations.map((org) => (
                    <div key={org.id} className='flex items-center gap-2'>
                      <Avatar className='h-6 w-6 border border-primary/20'>
                        {org.image_url ? (
                          <Image
                            src={org.image_url}
                            alt={org.name}
                            fill
                            className='object-cover rounded-full'
                            sizes='24px'
                          />
                        ) : (
                          <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white text-xs'>
                            {getInitials(org.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className='text-sm font-medium flex-1'>{org.name}</span>
                    </div>
                  ))}
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <div className='flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0'>
              {/* Single Avatar */}
              <Avatar className='h-8 w-8 sm:h-10 sm:w-10 border-2 border-background ring-offset-background transition-all duration-300 group-hover:shadow-sm flex-shrink-0'>
                {organizationImageUrl ? (
                  <Image
                    src={organizationImageUrl}
                    alt={event.organization?.name || ''}
                    fill
                    className='object-cover rounded-full'
                    sizes='(max-width: 640px) 32px, 40px'
                  />
                ) : (
                  <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white font-medium text-xs'>
                    {orgInitials}
                  </AvatarFallback>
                )}
              </Avatar>
              
              {/* Organization name and category badge */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <span className='leading-tight line-clamp-2 flex-1 min-w-0 font-medium text-sm sm:text-base'>
                    {organizationNamesDisplay}
                  </span>
                  
                  {event.category && event.category.slug !== CATEGORY_SLUGS.REKRUTACJA && (
                    <Badge
                      variant='outline'
                      className={cn(
                        'bg-gradient-to-r from-primary/20 to-secondary/20 text-xs sm:text-sm border-primary/50 hidden sm:inline-flex flex-shrink-0'
                      )}
                    >
                      {categoryName}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Share button outside hover area */}
          <ShareButton event={event} variant='ghost' size='icon' className='h-8 w-8 flex-shrink-0' />
        </div>
        {event.image_url && (
        <div
          className={cn(
            'relative w-full overflow-hidden bg-gray-100 dark:bg-gray-900',
            event.aspect_ratio === '1:1' ? 'aspect-square' : 'aspect-[16/9]',
            isImageLoading && 'animate-pulse'
          )}
        >
          <Image
            src={event.image_url}
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
                  className='font-medium hover:underline flex items-start gap-1 cursor-pointer min-w-0'
                  title={t('openInMaps')}
                >
                  <span className='line-clamp-2'>{event.location}</span>
                  <ExternalLink className='h-3 w-3 flex-shrink-0 mt-0.5' />
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
