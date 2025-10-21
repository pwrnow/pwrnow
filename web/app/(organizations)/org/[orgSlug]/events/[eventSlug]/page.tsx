'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Plus,
  ShieldCheck,
  Clock3,
  Share2,
  Copy,
  Check,
  Wand2,
} from 'lucide-react';
import Image from 'next/image';
import { CATEGORY_SLUGS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

import {
  getEventBySlug,
  getCurrentOrganization,
  createScheduleItem,
  deleteScheduleItem,
  getParseScheduleAvailability,
  checkFeatureAccess,
} from '@/lib/api';
import { Event, Organization, Post, Schedule, ScheduleItem } from '@/lib/types';
import { EventBadge } from '@/components/event-badge';
import { useTranslations } from 'next-intl';
import PostsList from '@/components/posts-list';
import CreatePostModal from '@/components/create-post-modal';
import CreatePostComposer from '@/components/create-post-composer';
import { toast } from 'sonner';
import { createEventPublicUrl } from '@/lib/url-utils';
import EventScheduleDaySelector, {
  DayOption,
} from '@/components/event-schedule-day-selector';
import EventScheduleList from '@/components/event-schedule-list';
import EventScheduleAddModal from '@/components/event-schedule-add-modal';
import MagicImportModal from '@/components/magic-import-modal';

export default function OrgEventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const eventSlug = params.eventSlug as string;
  const t = useTranslations('EventDetailsPage');

  const [event, setEvent] = useState<Event | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [copied, setCopied] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMagicImportModalOpen, setIsMagicImportModalOpen] = useState(false);
  const [parseAvailable, setParseAvailable] = useState<boolean | null>(null);
  const [parseUnavailableMessage, setParseUnavailableMessage] = useState<string>('');
  const [hasMagicParsingAccess, setHasMagicParsingAccess] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        let currentOrg: Organization;
        try {
          currentOrg = await getCurrentOrganization();
          if (currentOrg.slug !== orgSlug) {
            setError(t('accessDenied'));
            return;
          }
          setOrganization(currentOrg);
        } catch {
          router.push('/');
          return;
        }

        try {
          const eventData = await getEventBySlug(eventSlug);
          if (eventData.organization.id !== currentOrg.id) {
            setError(t('eventNotFound'));
            return;
          }
          setEvent(eventData);
        } catch {
          setError(t('eventNotFound'));
          return;
        }
      } catch {
        setError(t('loadError'));
      } finally {
        setLoading(false);
      }
    }

    if (orgSlug && eventSlug) {
      loadData();
    }
  }, [orgSlug, eventSlug, router, t]);

  // Reset selected day only when event slug changes (navigating to different event)
  useEffect(() => {
    if (event) {
      const initialDay = pickInitialDayFromSchedule(
        event.schedule || null,
        event
      );
      if (initialDay) setSelectedDay(initialDay);
    } else {
      setSelectedDay('');
    }
  }, [event?.slug]); // Only depend on event slug, not schedule

  // Check AI parse availability and feature access when schedule tab becomes active
  useEffect(() => {
    async function checkAvailability() {
      if (!event?.slug) return;
      
      try {
        // Check feature access first
        const featureAccess = await checkFeatureAccess(event.slug, ['magic_parsing']);
        const hasAccess = featureAccess.features.magic_parsing;
        setHasMagicParsingAccess(hasAccess);
        
        if (!hasAccess) {
          setParseAvailable(false);
          setParseUnavailableMessage(t('featureNotAvailable'));
          return;
        }
        
        // If feature access is granted, check rate limiting
        const res = await getParseScheduleAvailability(event.slug);
        setParseAvailable(res.available);
        if (!res.available) {
          setParseUnavailableMessage(t('rateLimited'));
        } else {
          setParseUnavailableMessage('');
        }
      } catch {
        // If checking fails, do not block the button
        setParseAvailable(true);
        setParseUnavailableMessage('');
        setHasMagicParsingAccess(true);
      }
    }
    if (activeTab === 'schedule') {
      checkAvailability();
    }
  }, [activeTab, t]);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePostCreated = (newPost: Post) => {
    // Update event state with the new post instead of reloading
    if (event) {
      setEvent({
        ...event,
        posts: [newPost, ...(event.posts || [])],
      });
    }
    setIsCreatePostModalOpen(false);
    setActiveTab('posts');
  };

  const handlePostDeleted = (postId: string) => {
    // Update event state by removing the deleted post
    if (event) {
      setEvent({
        ...event,
        posts: (event.posts || []).filter((post) => post.id !== postId),
      });
    }
  };

  const handleCopyLink = async () => {
    const url = createEventPublicUrl(eventSlug);

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error(t('copyFailed'));
    }
  };

  const dayOptions: DayOption[] = useMemo(
    () => buildDayOptions(event?.starts_at, event?.ends_at),
    [event?.starts_at, event?.ends_at]
  );

  const itemsByDay: Record<string, ScheduleItem[]> = useMemo(
    () => groupItemsByDate(event?.schedule?.items || []),
    [event?.schedule?.items]
  );

  const currentItems = useMemo(
    () => (selectedDay ? itemsByDay[selectedDay] || [] : []),
    [selectedDay, itemsByDay]
  );

  const initialStartTime = useMemo(
    () => getInitialStartTimeForSelectedDay(currentItems),
    [currentItems]
  );

  const canManage =
    !!organization && !!event && organization.id === event.organization.id;

  const handleCreateScheduleItem = async (payload: {
    event_slug: string;
    date: string;
    start_time: string;
    end_time: string;
    title: string;
    description?: string;
  }) => {
    try {
      const newItem = await createScheduleItem(payload);
      // Update local state more efficiently
      setEvent((prevEvent) => {
        if (!prevEvent) return prevEvent;
        const updatedSchedule = {
          id: prevEvent.schedule?.id || '',
          items: [...(prevEvent.schedule?.items || []), newItem],
        };
        return {
          ...prevEvent,
          schedule: updatedSchedule,
        };
      });
      toast.success(t('createSuccess'));
    } catch {
      toast.error(t('createError'));
    }
  };

  const handleScheduleParsed = async (
    scheduleItems: Array<{
      date: string;
      start_time: string;
      end_time: string;
      title: string;
      description?: string;
    }>
  ) => {
    try {
      // Create schedule items one by one and collect them
      const newItems: ScheduleItem[] = [];
      for (const item of scheduleItems) {
        const createData = {
          event_slug: event!.slug,
          date: item.date,
          start_time: item.start_time,
          end_time: item.end_time,
          title: item.title,
          description: item.description || '',
        };
        const newItem = await createScheduleItem(createData);
        newItems.push(newItem);
      }

      // Update local state more efficiently
      setEvent((prevEvent) => {
        if (!prevEvent) return prevEvent;
        const updatedSchedule = {
          id: prevEvent.schedule?.id || '',
          items: [...(prevEvent.schedule?.items || []), ...newItems],
        };
        return {
          ...prevEvent,
          schedule: updatedSchedule,
        };
      });

      toast.success(
        `Successfully imported ${scheduleItems.length} schedule items!`
      );
    } catch (error) {
      console.error('Failed to import schedule items:', error);
      toast.error('Failed to import some schedule items. Please try again.');
    }
  };

  const handleDeleteScheduleItem = async (id: string) => {
    try {
      await deleteScheduleItem(id);
      // Update local state more efficiently
      setEvent((prevEvent) => {
        if (!prevEvent || !prevEvent.schedule) return prevEvent;
        const updatedSchedule = {
          id: prevEvent.schedule.id,
          items: prevEvent.schedule.items.filter((item) => item.id !== id),
        };
        return {
          ...prevEvent,
          schedule: updatedSchedule,
        };
      });
      toast.success(t('deleteSuccess'));
    } catch {
      toast.error(t('deleteError'));
    }
  };

  if (loading) {
    return (
      <div className='w-full mx-auto max-w-4xl px-4 py-6'>
        <div className='mb-6'>
          <Skeleton className='h-9 w-32' />
        </div>
        <Card className='p-6 mb-6'>
          <div className='flex items-center space-x-4 mb-4'>
            <Skeleton className='w-12 h-12 rounded-full' />
            <div>
              <Skeleton className='h-6 w-48 mb-2' />
              <Skeleton className='h-4 w-32' />
            </div>
          </div>
          <Skeleton className='h-64 w-full rounded-lg mb-4' />
          <Skeleton className='h-8 w-3/4 mb-2' />
          <Skeleton className='h-4 w-full mb-1' />
          <Skeleton className='h-4 w-2/3' />
        </Card>
        <Skeleton className='h-10 w-48 mb-4' />
        <Card className='p-6'>
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className='h-4 w-full mb-2' />
                <Skeleton className='h-4 w-3/4' />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error || !event || !organization) {
    return (
      <div className='flex items-center justify-center p-4 min-h-[60vh]'>
        <Card className='w-full max-w-md p-8 text-center shadow-xl'>
          <div className='mb-4'>
            <div className='w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4'>
              <ExternalLink className='w-8 h-8 text-destructive' />
            </div>
            <h1 className='text-2xl font-bold text-destructive mb-2'>
              {t('error')}
            </h1>
            <p className='text-muted-foreground mb-6'>{error}</p>
          </div>
          <Button
            onClick={() => router.push(`/org/${orgSlug}`)}
            variant='outline'
            className='cursor-pointer'
          >
            {t('backToOrganization')}
          </Button>
        </Card>
      </div>
    );
  }

  const eventDate = formatDate(event.starts_at);
  const startTime = formatTime(event.starts_at);
  const endTime = formatTime(event.ends_at);
  const timeString = `${startTime} - ${endTime}`;

  function buildDayOptions(startsAt?: string, endsAt?: string): DayOption[] {
    // Copy mobile generateEventDays logic exactly
    if (!startsAt || !endsAt) return [];

    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const days: DayOption[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Check if it's a single day event by comparing date strings
    const startDateStr = startsAt.split('T')[0];
    const endDateStr = endsAt.split('T')[0];

    if (startDateStr === endDateStr) {
      // Single day event - only include the start date
      const currentStr = startDateStr;
      const currentDate = new Date(start);
      const isPast = currentDate < new Date(todayStr);
      const isToday = currentStr === todayStr;

      days.push({
        id: currentStr,
        label: start.toLocaleDateString('pl-PL', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
        }),
        isToday,
        isPast,
      });
    } else {
      // Multi-day event - include all days from start to end
      const current = new Date(start);

      while (current.getDate() <= end.getDate()) {
        const currentStr = current.toISOString().split('T')[0];
        const currentDate = new Date(current);
        const isPast = currentDate < new Date(todayStr);
        const isToday = currentStr === todayStr;

        days.push({
          id: currentStr,
          label: current.toLocaleDateString('pl-PL', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
          }),
          isToday,
          isPast,
        });

        current.setDate(current.getDate() + 1);
      }
    }

    return days;
  }

  function groupItemsByDate(
    items: ScheduleItem[]
  ): Record<string, ScheduleItem[]> {
    const map: Record<string, ScheduleItem[]> = {};
    for (const item of items) {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) =>
        a.start_time < b.start_time ? -1 : a.start_time > b.start_time ? 1 : 0
      );
    }
    return map;
  }

  function pickInitialDayFromSchedule(
    s: Schedule | null,
    ev: Event | null
  ): string | null {
    if (!ev) return null;

    // If no schedule, return the event start date
    if (!s || !s.items || s.items.length === 0) {
      return ev.starts_at.slice(0, 10);
    }

    // If schedule exists, try to select today if it's within the event dates, otherwise select the first day
    const dates = Array.from(new Set(s.items.map((i) => i.date))).sort();
    const today = new Date().toISOString().slice(0, 10);

    // Check if today is within the event date range
    const eventStartDate = ev.starts_at.slice(0, 10);
    const eventEndDate = ev.ends_at.slice(0, 10);

    if (
      today >= eventStartDate &&
      today <= eventEndDate &&
      dates.includes(today)
    ) {
      return today;
    }

    return dates[0] || eventStartDate;
  }

  function getInitialStartTimeForSelectedDay(
    items: ScheduleItem[]
  ): string | null {
    if (!items || items.length === 0) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    const last = items[items.length - 1];
    const [h, m] = last.end_time.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }

  return (
    <div className='w-full mx-auto max-w-4xl px-4 py-6'>
      <div className='mb-6'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => router.push(`/org/${orgSlug}`)}
          className='gap-2 cursor-pointer'
        >
          <ArrowLeft className='h-4 w-4' />
          {t('backToEvents')}
        </Button>
      </div>

      {/* Event Header - Title and Verification Status */}
      <div className='mb-6'>
        <div className='flex items-start justify-between gap-4 mb-2'>
          <h1 className='text-3xl font-bold display-font break-words leading-tight flex-1'>
            {event.title}
          </h1>
          <div className='flex items-center gap-3 flex-shrink-0'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleCopyLink}
              className='gap-2'
            >
              {copied ? (
                <Check className='h-4 w-4' />
              ) : (
                <Share2 className='h-4 w-4' />
              )}
              {copied ? t('copied') : t('share')}
            </Button>
            {event.verified ? (
              <div className='flex items-center gap-2 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 px-3 py-2 rounded-full text-sm font-medium'>
                <ShieldCheck className='h-4 w-4' />
                {t('verified')}
              </div>
            ) : (
              <div className='flex items-center gap-2 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-3 py-2 rounded-full text-sm font-medium'>
                <Clock3 className='h-4 w-4' />
                {t('pending')}
              </div>
            )}
          </div>
        </div>
        <p className='text-muted-foreground'>
          {t('organizationBy')} {organization.name}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className={`grid w-full ${event.category.slug === CATEGORY_SLUGS.REKRUTACJA ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <TabsTrigger value='details'>{t('details')}</TabsTrigger>
          {event.category.slug !== CATEGORY_SLUGS.REKRUTACJA && (
            <TabsTrigger value='posts'>{t('posts')}</TabsTrigger>
          )}
          <TabsTrigger value='schedule'>{t('schedule')}</TabsTrigger>
        </TabsList>

        <TabsContent value='details' className='mt-6'>
          <Card className='p-6'>
            {/* Organization and Event Image */}
            <div className='flex items-center space-x-3 mb-3'>
              <Avatar className='h-12 w-12 border border-primary/20'>
                <AvatarImage
                  src={organization.image_url || undefined}
                  alt={organization.name}
                />
                <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white font-medium'>
                  {getInitials(organization.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='font-semibold text-lg'>{organization.name}</p>
                <p className='text-sm text-muted-foreground'>
                  {event.category.name}
                </p>
              </div>
            </div>

            {/* Event Image */}
            {event.image_url && (
              <div className='relative w-full overflow-hidden bg-gray-100 dark:bg-gray-900 aspect-[16/9] mb-3 rounded-lg'>
                <Image
                  src={event.image_url}
                  alt={event.title}
                  fill
                  className='object-cover'
                />
              </div>
            )}

            {/* Event Details */}
            <div className='space-y-2 mb-3'>
              <div className='flex items-center'>
                <div className='p-2 rounded-md bg-blue-100 dark:bg-blue-950 mr-3 flex-shrink-0'>
                  <Calendar className='h-5 w-5 text-blue-500 dark:text-blue-400' />
                </div>
                <div>
                  <p className='font-medium'>{eventDate}</p>
                </div>
              </div>

              <div className='flex items-center'>
                <div className='p-2 rounded-md bg-purple-100 dark:bg-purple-950 mr-3 flex-shrink-0'>
                  <Clock className='h-5 w-5 text-purple-500 dark:text-purple-400' />
                </div>
                <div>
                  <p className='font-medium'>{timeString}</p>
                </div>
              </div>

              {event.location && (
                <div className='flex items-center'>
                  <div className='p-2 rounded-md bg-red-100 dark:bg-red-950 mr-3 flex-shrink-0'>
                    <MapPin className='h-5 w-5 text-red-500 dark:text-red-400' />
                  </div>
                  <div>
                    <p className='font-medium'>{event.location}</p>
                  </div>
                </div>
              )}

              {event.url && (
                <div className='flex items-center'>
                  <div className='p-2 rounded-md bg-green-100 dark:bg-green-950 mr-3 flex-shrink-0'>
                    <ExternalLink className='h-5 w-5 text-green-500 dark:text-green-400' />
                  </div>
                  <div className='flex-1'>
                    <a
                      href={event.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:underline break-all'
                    >
                      {event.url}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Event Description */}
            <div className='border-t pt-3'>
              {event.description ? (
                <div className='text-muted-foreground leading-relaxed whitespace-pre-wrap break-words'>
                  {event.description}
                </div>
              ) : (
                <p className='text-muted-foreground italic'>
                  {t('noDescription')}
                </p>
              )}
            </div>
          </Card>
        </TabsContent>

        {event.category.slug !== CATEGORY_SLUGS.REKRUTACJA && (
          <TabsContent value='posts' className='mt-6'>
            <div className='mb-4'>
              <CreatePostComposer
                onPostCreated={handlePostCreated}
                eventSlug={event.slug}
              />
            </div>

            {event?.posts && event.posts.length > 0 ? (
              <PostsList
                posts={event.posts}
                onPostDeleted={handlePostDeleted}
                organizationId={organization.id}
              />
            ) : (
              <Card className='p-12 text-center'>
                <div className='max-w-md mx-auto'>
                  <div className='w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6'>
                    <Plus className='w-10 h-10 text-muted-foreground' />
                  </div>
                  <h3 className='text-xl font-semibold mb-3'>{t('noPosts')}</h3>
                  <p className='text-muted-foreground mb-6'>
                    {t('noPostsDescription')}
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>
        )}

        <TabsContent value='schedule' className='mt-6'>
          <div className='space-y-4 max-w-2xl mx-auto'>
            <EventScheduleDaySelector
              days={dayOptions}
              selectedDay={selectedDay}
              onSelect={setSelectedDay}
            />

            {currentItems.length > 0 ? (
              <EventScheduleList
                items={currentItems}
                canDelete={canManage}
                onDelete={handleDeleteScheduleItem}
              />
            ) : (
              <Card className='p-12 text-center text-muted-foreground'>
                {t('scheduleEmpty')}
              </Card>
            )}

            {canManage && selectedDay && (
              <div className='flex justify-center gap-3 pt-2'>
                {hasMagicParsingAccess && (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='outline'
                        onClick={() => {
                          if (parseAvailable === false || !hasMagicParsingAccess) return;
                          setIsMagicImportModalOpen(true);
                        }}
                        aria-disabled={parseAvailable === false || !hasMagicParsingAccess}
                        className={`cursor-pointer ${(parseAvailable === false || !hasMagicParsingAccess) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Wand2 className='h-4 w-4 mr-2' />
                          Magic Import
                        </Button>
                      </TooltipTrigger>
                      {(parseAvailable === false || !hasMagicParsingAccess) && (
                        <TooltipContent>
                          {parseUnavailableMessage}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className='cursor-pointer'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  {t('addScheduleItem')}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <EventScheduleAddModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        eventSlug={event.slug}
        selectedDate={selectedDay}
        initialStartTime={initialStartTime}
        onCreate={handleCreateScheduleItem}
      />

      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onPostCreated={handlePostCreated}
        eventSlug={event.slug}
      />

      <MagicImportModal
        open={isMagicImportModalOpen}
        onOpenChange={setIsMagicImportModalOpen}
        eventSlug={event.slug}
        eventTitle={event.title}
        eventStartDate={event.starts_at}
        eventEndDate={event.ends_at}
        onScheduleParsed={handleScheduleParsed}
      />
    </div>
  );
}
