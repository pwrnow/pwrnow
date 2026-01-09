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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Calendar,
  MapPin,
  ExternalLink,
  Settings,
  Clock,
  ShieldCheck,
  Clock3,
  MoreHorizontal,
  Trash2,
  Users,
} from 'lucide-react';
import { Event, Organization } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_SLUGS } from '@/lib/constants';
import { EventBadge } from '@/components/event-badge';
import { useTranslations } from 'next-intl';
import { deleteEvent } from '@/lib/api';
import { toast } from 'sonner';

interface OrgEventCardProps {
  event: Event;
  orgSlug: string;
  getInitials: (name: string) => string;
  handleMapLinkClick: (location: string) => void;
  truncateDescription: (text: string, maxLength: number) => string;
  isUpcoming: (dateString: string) => boolean;
  onEventDeleted?: (eventSlug: string) => void;
  hideImage?: boolean;
}

export default function OrgEventCard({
  event,
  orgSlug,
  getInitials,
  handleMapLinkClick,
  truncateDescription,
  isUpcoming,
  onEventDeleted,
  hideImage,
}: OrgEventCardProps) {
  const router = useRouter();
  const t = useTranslations('OrganizationPage');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEventToday =
    new Date(event.starts_at).toDateString() === new Date().toDateString();

  // Check if this event is co-hosted (current org is not the admin)
  const isCoHost = event.is_co_host === true;

  // Get display name: prefer short_name, otherwise use full name
  const getDisplayName = (org: Organization | undefined) => {
    if (!org) return '';
    return org.short_name || org.display_name || org.name;
  };

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

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteEvent(event.slug);
      toast.success(t('eventDeletedSuccessfully'));
      onEventDeleted?.(event.slug);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error(t('failedToDeleteEvent'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className='border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group bg-card flex flex-col h-full'>
      {/* Status Bars */}
      <div className='flex flex-col'>
        {/* Co-hosting Badge */}
        {isCoHost && (
          <div className='w-full py-1 px-3 text-xs font-medium flex items-center justify-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'>
            <Users className='h-3 w-3' />
            {t('coHosting')}
          </div>
        )}
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
      </div>

      <div className='flex flex-col flex-1'>
        {/* Organization Header */}
        <div className='px-3 py-2 sm:px-4 sm:py-3 flex items-center space-x-2 sm:space-x-3'>
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
                          <AvatarImage
                            src={org.image_url || undefined}
                            alt={org.name}
                          />
                          <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white font-medium text-xs'>
                            {getInitials(org.name)}
                          </AvatarFallback>
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
                  
                  {/* Organization names */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='leading-tight line-clamp-2 flex-1 min-w-0 text-xs sm:text-sm font-medium text-foreground/80'>
                        {organizationNamesDisplay}
                      </span>
                      <div className='flex items-center gap-2 flex-shrink-0'>
                        {isEventToday ? (
                          <EventBadge variant='today' />
                        ) : (
                          event.is_new && <EventBadge variant='new' />
                        )}
                      </div>
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
                        <AvatarImage
                          src={org.image_url || undefined}
                          alt={org.name}
                        />
                        <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white text-xs'>
                          {getInitials(org.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className='text-sm font-medium flex-1'>{org.name}</span>
                    </div>
                  ))}
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <div className='flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0'>
              <Avatar className='h-8 w-8 sm:h-10 sm:w-10 border border-primary/20 ring-offset-background transition-all duration-300 group-hover:shadow-sm flex-shrink-0'>
                <AvatarImage
                  src={event.organization.image_url || undefined}
                  alt={event.organization.name}
                />
                <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white font-medium'>
                  {getInitials(event.organization.name)}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <span className='font-medium text-sm sm:text-base leading-tight line-clamp-2 flex-1 min-w-0'>
                    {getDisplayName(event.organization)}
                  </span>
                  <div className='flex items-center gap-2 flex-shrink-0'>
                    {isEventToday ? (
                      <EventBadge variant='today' />
                    ) : (
                      event.is_new && <EventBadge variant='new' />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Event Image */}
        {!hideImage && event.image_url && (
          <div className='relative w-full overflow-hidden bg-gray-100 dark:bg-gray-900 aspect-[16/9]'>
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className='object-cover transition-transform duration-500 z-10'
            />
          </div>
        )}

        {/* Event Content */}
        <div className='px-3 pt-3 sm:px-4 sm:pt-4 pb-4 sm:pb-6 flex flex-col flex-1'>
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
                  className='font-medium hover:underline flex items-start gap-1 cursor-pointer min-w-0'
                  title={t('openInMaps')}
                >
                  <span className='line-clamp-2'>{event.location}</span>
                  <ExternalLink className='h-3 w-3 flex-shrink-0 mt-0.5' />
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

          {/* Action Buttons - Pushed to bottom */}
          <div className='mt-auto pt-4 space-y-2'>
            {/* Only show manage/delete buttons for admin (non co-host) events */}
            {!isCoHost && (
              <div className='flex gap-2'>
                {event.verified && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      router.push(`/org/${orgSlug}/events/${event.slug}`)
                    }
                    className='flex-1 flex items-center gap-2 transition-all duration-300 cursor-pointer hover:bg-primary/5 hover:border-primary/20'
                  >
                    <Settings className='h-4 w-4' />
                    {t('manageEvent')}
                  </Button>
                )}

                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleDeleteClick}
                  className={`${event.verified ? 'flex-1' : 'w-full'} text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 flex items-center gap-2 transition-all duration-300 cursor-pointer hover:border-destructive/30`}
                  title={t('deleteEvent')}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            )}

            {event.url && (
              <a href={event.url} target='_blank' rel='noopener noreferrer'>
                <Button
                  variant='default'
                  size='sm'
                  className='w-full flex items-center gap-2 transition-all duration-300 cursor-pointer hover:bg-primary/90'
                >
                  <ExternalLink className='h-4 w-4' />
                  {event.category?.slug === CATEGORY_SLUGS.REKRUTACJA
                    ? t('openRecruitmentForm')
                    : t('visitEventPage')}
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className='h-px bg-border sm:hidden mt-2 mb-2'></div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteEvent')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteEventConfirmation', { title: event.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleting ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
