'use client';

import Image from 'next/image';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  Clock3,
  Navigation,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DeleteEventButton from './delete-event-button';
import { useEventLinkTracking } from './posthog-provider';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  image_url: string | null;
  url: string | null;
  verified?: boolean;
  organization?: {
    id: string;
    name: string;
    image_url: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface EventCardProps {
  event: Event;
  showOrganization?: boolean;
  showVerificationStatus?: boolean;
  allowDelete?: boolean;
}

export default function EventCard({
  event,
  showOrganization = false,
  showVerificationStatus = false,
  allowDelete = false,
}: EventCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9'>('16:9');
  const [isImageLoading, setIsImageLoading] = useState(true);
  // Get tracking function from our custom hook
  const { trackEventClick } = useEventLinkTracking();

  // Parse dates
  const startsAt = parseISO(event.starts_at);
  const endsAt = parseISO(event.ends_at);

  // Format date and time
  const dateString = format(startsAt, 'd MMMM yyyy', { locale: pl });
  const startTimeString = format(startsAt, 'HH:mm');
  const endTimeString = format(endsAt, 'HH:mm');
  const timeString = `${startTimeString} - ${endTimeString}`;

  const organizationName = event.organization?.name || 'Wydarzenie';
  const organizationImageUrl = event.organization?.image_url;
  const categoryName = event.category?.name || 'Wydarzenie';

  // Get organization initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const orgInitials = getInitials(organizationName);

  // Determine if the event is verified or not
  const isVerified = event.verified !== undefined ? event.verified : false;

  // Function to detect image aspect ratio
  const detectAspectRatio = (width: number, height: number) => {
    const ratio = width / height;
    // Allow some tolerance around the target ratios
    if (Math.abs(ratio - 1) <= 0.1) {
      return '1:1';
    }
    if (Math.abs(ratio - 16 / 9) <= 0.1) {
      return '16:9';
    }
    // Default to 16:9 for other ratios
    return '16:9';
  };

  // Handle click on event link
  const handleEventLinkClick = () => {
    trackEventClick(event.id, event.title, {
      organization: event.organization?.name,
      category: event.category?.name,
      location: event.location,
      starts_at: event.starts_at,
      event_url: event.url,
      view_source: showOrganization ? 'organization_view' : 'user_view',
    });
  };

  // Function to handle map link clicks
  const handleMapLinkClick = () => {
    if (!event.location) return;

    // Check if the user is on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Encode the location for the URL
    const encodedLocation = encodeURIComponent(event.location);

    // Create the appropriate maps URL
    const mapsUrl = isIOS
      ? `maps://?q=${encodedLocation}`
      : `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

    // Open the maps URL in a new tab
    window.open(mapsUrl, '_blank');
  };

  const truncateDescription = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div className='mb-8 border-0 sm:border sm:rounded-lg sm:shadow-sm hover:sm:shadow-md transition-all duration-300 overflow-hidden group'>
      {/* Verification Status Bar - Only shown when showVerificationStatus is true */}
      {showVerificationStatus && (
        <div
          className={`w-full py-1 px-3 text-xs font-medium flex items-center justify-center gap-1 ${
            isVerified
              ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          {isVerified ? (
            <>
              <ShieldCheck className='h-3 w-3' />
              Zatwierdzony
            </>
          ) : (
            <>
              <Clock3 className='h-3 w-3' />
              Oczekuje na weryfikację
            </>
          )}
        </div>
      )}

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
              <span className='font-medium text-xs sm:text-sm leading-tight break-words max-w-[60%]'>
                {organizationName}
              </span>
              <div className='flex items-center gap-2'>
                {event.category && (
                  <Badge
                    variant='outline'
                    className='bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/50 text-xs sm:text-sm'
                  >
                    {categoryName}
                  </Badge>
                )}
                {allowDelete && event.organization && (
                  <DeleteEventButton
                    eventId={event.id}
                    organizationId={event.organization.id}
                    eventTitle={event.title}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'relative w-full overflow-hidden bg-gray-100 dark:bg-gray-900',
            aspectRatio === '1:1' ? 'aspect-square' : 'aspect-[16/9]',
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
            onLoad={(event) => {
              const img = event.target as HTMLImageElement;
              setAspectRatio(
                detectAspectRatio(img.naturalWidth, img.naturalHeight)
              );
              setIsImageLoading(false);
            }}
          />
        </div>

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
                  className='font-medium hover:underline flex items-center gap-1'
                  title='Otwórz w aplikacji map'
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
                  className='mt-1 h-auto p-0 text-primary'
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                >
                  {isDescriptionExpanded ? 'Pokaż mniej' : 'Pokaż więcej'}
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
                  className='w-full flex items-center gap-2 transition-all duration-300'
                >
                  <ExternalLink className='h-4 w-4' />
                  Odwiedź stronę wydarzenia
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
