'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Calendar,
  MapPin,
  ExternalLink,
  Settings,
  Clock,
  ShieldCheck,
  Clock3,
  MoreHorizontal,
} from 'lucide-react';
import { Event } from '@/lib/types';
import { EventBadge } from '@/components/event-badge';
import { useTranslations } from 'next-intl';

interface EventCardProps {
  event: Event;
  orgSlug: string;
  getInitials: (name: string) => string;
  handleMapLinkClick: (location: string) => void;
  truncateDescription: (text: string, maxLength: number) => string;
  isUpcoming: (dateString: string) => boolean;
}

export default function EventCard({
  event,
  orgSlug,
  getInitials,
  handleMapLinkClick,
  truncateDescription,
  isUpcoming,
}: EventCardProps) {
  const router = useRouter();
  const t = useTranslations('OrganizationPage');

  const isEventToday =
    new Date(event.starts_at).toDateString() === new Date().toDateString();

  // Format date and time exactly like the old component
  const startsAt = new Date(event.starts_at);
  const endsAt = new Date(event.ends_at);
  const dateString = startsAt.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const startTimeString = startsAt.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTimeString = endsAt.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const timeString = `${startTimeString} - ${endTimeString}`;

  return (
    <div className='border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group bg-card'>
      {/* Verification Status Bar */}
      <div
        className={`w-full py-1 px-3 text-xs font-medium flex items-center justify-center gap-1 ${
          event.verified
            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
        }`}
      >
        {event.verified ? (
          <>
            <ShieldCheck className='h-3 w-3' />
            {t('approved')}
          </>
        ) : (
          <>
            <Clock3 className='h-3 w-3' />
            {t('pendingVerification')}
          </>
        )}
      </div>

      <div className='flex flex-col'>
        {/* Organization Header */}
        <div className='px-3 py-2 sm:px-4 sm:py-3 flex items-center space-x-2 sm:space-x-3'>
          <Avatar className='h-8 w-8 sm:h-10 sm:w-10 border border-primary/20 ring-offset-background transition-all duration-300 group-hover:shadow-sm'>
            <AvatarImage
              src={event.organization.image_url || undefined}
              alt={event.organization.name}
            />
            <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white font-medium'>
              {getInitials(event.organization.name)}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <div className='flex items-center justify-between'>
              <span className='font-medium text-sm sm:text-base leading-tight break-words max-w-[60%]'>
                {event.organization.name}
              </span>
              <div className='flex items-center gap-2'>
                {isEventToday ? (
                  <EventBadge variant='today' />
                ) : (
                  event.is_new && <EventBadge variant='new' />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Image */}
        <div className='relative w-full overflow-hidden bg-gray-100 dark:bg-gray-900 aspect-[16/9]'>
          <Image
            src={event.image_url || '/placeholder.svg'}
            alt={event.title}
            fill
            className='object-cover transition-transform duration-500 z-10'
          />
        </div>

        {/* Event Content */}
        <div className='px-3 pt-3 sm:px-4 sm:pt-4 pb-4 sm:pb-6'>
          <h2 className='text-lg sm:text-xl font-bold display-font mb-2 sm:mb-3 break-words leading-tight'>
            {event.title}
          </h2>

          {/* Event Details with colored icons */}
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
                  onClick={() => handleMapLinkClick(event.location!)}
                  className='font-medium hover:underline flex items-center gap-1 cursor-pointer'
                  title={t('openInMaps')}
                >
                  {event.location}
                  <ExternalLink className='h-3 w-3' />
                </button>
              </div>
            )}
          </div>

          {/* Event Description */}
          {event.description && (
            <div className='text-muted-foreground leading-relaxed text-xs sm:text-sm mb-3 sm:mb-4'>
              <p className='whitespace-pre-wrap break-words'>
                {truncateDescription(event.description, 200)}
              </p>
              {event.description.length > 200 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant='link'
                      size='sm'
                      className='p-0 h-auto text-primary hover:text-primary/80 cursor-pointer mt-1'
                    >
                      <MoreHorizontal className='h-3 w-3 mr-1' />
                      {t('showMore')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='!max-w-6xl max-h-[80vh] overflow-y-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
                    <DialogHeader>
                      <DialogTitle className='text-left display-font'>
                        {event.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className='mt-4'>
                      <div className='text-muted-foreground leading-relaxed whitespace-pre-wrap break-words'>
                        {event.description}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className='mt-3 space-y-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                router.push(`/org/${orgSlug}/events/${event.slug}`)
              }
              className='w-full flex items-center gap-2 transition-all duration-300 cursor-pointer'
            >
              <Settings className='h-4 w-4' />
              {t('manageEvent')}
            </Button>

            {event.url && (
              <a href={event.url} target='_blank' rel='noopener noreferrer'>
                <Button
                  variant='default'
                  size='sm'
                  className='w-full flex items-center gap-2 transition-all duration-300 cursor-pointer'
                >
                  <ExternalLink className='h-4 w-4' />
                  {t('visitEventPage')}
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className='h-px bg-border sm:hidden mt-2 mb-2'></div>
    </div>
  );
}
