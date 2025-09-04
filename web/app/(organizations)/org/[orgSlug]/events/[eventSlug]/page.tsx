'use client';

import { useEffect, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

import {
  getEventBySlug,
  getCurrentOrganization,
  createScheduleItem,
  deleteScheduleItem,
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

  // Reset selected day when event changes and set initial day from schedule
  useEffect(() => {
    if (event?.schedule) {
      const initialDay = pickInitialDayFromSchedule(event.schedule, event);
      if (initialDay) setSelectedDay(initialDay);
    } else {
      setSelectedDay('');
    }
  }, [event?.slug, event?.schedule]);

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

  const dayOptions: DayOption[] = buildDayOptions(
    event?.schedule?.items || [],
    event?.starts_at,
    event?.ends_at
  );
  const itemsByDay: Record<string, ScheduleItem[]> = groupItemsByDate(
    event?.schedule?.items || []
  );
  const currentItems = selectedDay ? itemsByDay[selectedDay] || [] : [];

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
      await createScheduleItem(payload);
      // Refresh event data to get updated schedule
      window.location.reload();
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
      // Create schedule items one by one
      for (const item of scheduleItems) {
        const createData = {
          event_slug: event.slug,
          date: item.date,
          start_time: item.start_time,
          end_time: item.end_time,
          title: item.title,
          description: item.description || '',
        };
        await createScheduleItem(createData);
      }

      // Refresh the event data to get the updated schedule
      window.location.reload();
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
      // Refresh event data to get updated schedule
      window.location.reload();
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

  function buildDayOptions(
    items: ScheduleItem[],
    startsAt?: string,
    endsAt?: string
  ): DayOption[] {
    const uniqueDates = new Set<string>();
    items.forEach((i) => uniqueDates.add(i.date));
    // Ensure event date range days are included as options if present
    const extraDates: string[] = [];
    if (startsAt && endsAt) {
      const [sy, sm, sd] = startsAt
        .slice(0, 10)
        .split('-')
        .map((n) => parseInt(n, 10));
      const [ey, em, ed] = endsAt
        .slice(0, 10)
        .split('-')
        .map((n) => parseInt(n, 10));
      const startDate = new Date(sy, (sm || 1) - 1, sd || 1);
      const endDate = new Date(ey, (em || 1) - 1, ed || 1);
      for (
        let d = new Date(startDate.getTime());
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        extraDates.push(`${yyyy}-${mm}-${dd}`);
      }
    }
    extraDates.forEach((d) => uniqueDates.add(d));

    const today = new Date().toISOString().slice(0, 10);
    const options = Array.from(uniqueDates)
      .sort()
      .map((d) => {
        const [y, m, day] = d.split('-').map((n) => parseInt(n, 10));
        const date = new Date(y, (m || 1) - 1, day || 1);
        const label = date.toLocaleDateString('pl-PL', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
        });
        return {
          id: d,
          label,
          isToday: d === today,
          isPast: d < today,
        } as DayOption;
      });
    return options;
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
    if (!s || !ev) return ev ? ev.starts_at.slice(0, 10) : null;
    const dates = Array.from(new Set(s.items.map((i) => i.date))).sort();
    if (dates.length === 0) return ev.starts_at.slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    if (dates.includes(today)) return today;
    return dates[0];
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
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='details'>{t('details')}</TabsTrigger>
          <TabsTrigger value='posts'>{t('posts')}</TabsTrigger>
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
            <div className='relative w-full overflow-hidden bg-gray-100 dark:bg-gray-900 aspect-[16/9] mb-3 rounded-lg'>
              <Image
                src={event.image_url || '/placeholder.svg'}
                alt={event.title}
                fill
                className='object-cover'
              />
            </div>

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

        <TabsContent value='schedule' className='mt-6'>
          {event?.schedule ? (
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

              {canManage && (
                <div className='flex justify-center gap-2 pt-2'>
                  <Button
                    onClick={() => setIsMagicImportModalOpen(true)}
                    variant='outline'
                    className='cursor-pointer'
                  >
                    <Wand2 className='h-4 w-4 mr-2' />
                    Magic Import
                  </Button>
                  {selectedDay && (
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      className='cursor-pointer'
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      {t('addScheduleItem')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Card className='p-12 text-center text-muted-foreground'>
              {t('noSchedule')}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <EventScheduleAddModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        eventSlug={event.slug}
        selectedDate={selectedDay}
        initialStartTime={getInitialStartTimeForSelectedDay(currentItems)}
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
        onScheduleParsed={handleScheduleParsed}
      />
    </div>
  );
}
