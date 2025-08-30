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
  getEventPosts,
} from '@/lib/api';
import { Event, Organization, Post } from '@/lib/types';
import { EventBadge } from '@/components/event-badge';
import { useTranslations } from 'next-intl';
import PostsList from '@/components/posts-list';
import CreatePostModal from '@/components/create-post-modal';
import { toast } from 'sonner';
import { createEventPublicUrl } from '@/lib/url-utils';

export default function OrgEventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const eventSlug = params.eventSlug as string;
  const t = useTranslations('EventDetailsPage');

  const [event, setEvent] = useState<Event | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    async function loadPosts() {
      if (activeTab === 'posts' && event && posts.length === 0) {
        try {
          setPostsLoading(true);
          const postsData = await getEventPosts(event.slug);
          setPosts(postsData);
        } catch {
        } finally {
          setPostsLoading(false);
        }
      }
    }
    loadPosts();
  }, [activeTab, event, posts.length]);

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
    setPosts((prev) => [newPost, ...prev]);
    setIsCreatePostModalOpen(false);
    setActiveTab('posts');
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
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
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='details'>{t('details')}</TabsTrigger>
          <TabsTrigger value='posts'>{t('posts')}</TabsTrigger>
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
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>{t('eventPosts')}</h2>
            <Button
              onClick={() => setIsCreatePostModalOpen(true)}
              className='cursor-pointer'
            >
              <Plus className='h-4 w-4 mr-2' />
              {t('createPost')}
            </Button>
          </div>

          {postsLoading ? (
            <Card className='p-6'>
              <div className='space-y-4'>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className='flex space-x-3'>
                    <Skeleton className='w-10 h-10 rounded-full' />
                    <div className='flex-1'>
                      <Skeleton className='h-4 w-32 mb-2' />
                      <Skeleton className='h-4 w-full mb-1' />
                      <Skeleton className='h-4 w-3/4' />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : posts.length > 0 ? (
            <PostsList
              posts={posts}
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
                <Button
                  onClick={() => setIsCreatePostModalOpen(true)}
                  className='cursor-pointer'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  {t('createFirstPost')}
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onPostCreated={handlePostCreated}
        eventSlug={event.slug}
      />
    </div>
  );
}
