'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  PlusCircle,
  Calendar,
  MapPin,
  ExternalLink,
  Settings,
  Filter,
  Clock,
  ShieldCheck,
  Clock3,
  MoreHorizontal,
} from 'lucide-react';
import Image from 'next/image';
import { getCurrentOrganization, getEvents } from '@/lib/api';
import { Organization, Event } from '@/lib/types';
import { EventBadge } from '@/components/event-badge';

type FilterType = 'all' | 'verified' | 'unverified';

export default function OrganizationPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    async function loadOrganizationData() {
      try {
        setLoading(true);
        setError(null);

        // Get current authenticated organization
        let currentOrg: Organization;
        try {
          currentOrg = await getCurrentOrganization();

          // Verify that the URL slug matches the authenticated organization
          if (currentOrg.slug !== orgSlug) {
            setError('Nie masz dostępu do tej organizacji');
            return;
          }

          setOrganization(currentOrg);
        } catch {
          // Redirect to home page if not authenticated
          router.push('/');
          return;
        }

        // Load events
        try {
          const eventsData = await getEvents();

          // Validate that all events belong to the current organization
          if (currentOrg && eventsData.length > 0) {
            const invalidEvents = eventsData.filter(
              (event) => event.organization.id !== currentOrg.id
            );

            if (invalidEvents.length > 0) {
              // Filter out invalid events
              const validEvents = eventsData.filter(
                (event) => event.organization.id === currentOrg.id
              );
              setEvents(validEvents);
            } else {
              setEvents(eventsData);
            }
          } else {
            setEvents(eventsData);
          }
        } catch {
          setEvents([]);
        }
      } catch {
        setError('Nie udało się załadować danych organizacji');
      } finally {
        setLoading(false);
      }
    }

    if (orgSlug) {
      loadOrganizationData();
    }
  }, [orgSlug, router]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  const handleMapLinkClick = (location: string) => {
    if (!location) return;

    // Check if the user is on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Encode the location for the URL
    const encodedLocation = encodeURIComponent(location);

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

  const filteredEvents = events.filter((event) => {
    switch (filter) {
      case 'verified':
        return event.verified;
      case 'unverified':
        return !event.verified;
      default:
        return true;
    }
  });

  const upcomingEvents = filteredEvents.filter((event) =>
    isUpcoming(event.starts_at)
  );
  const pastEvents = filteredEvents.filter(
    (event) => !isUpcoming(event.starts_at)
  );
  const sortedEvents = [...upcomingEvents.reverse(), ...pastEvents.reverse()];

  if (loading) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='w-full mx-auto max-w-7xl px-4 py-6'>
          {/* Header Skeleton */}
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0'>
            <div className='flex items-center space-x-4'>
              <Skeleton className='w-16 h-16 rounded-full' />
              <div>
                <Skeleton className='h-8 w-48 mb-2' />
                <Skeleton className='h-4 w-32' />
              </div>
            </div>
            <div className='flex space-x-3'>
              <Skeleton className='h-10 w-32' />
              <Skeleton className='h-10 w-36' />
              <Skeleton className='h-10 w-10' />
            </div>
          </div>

          {/* Events Skeleton */}
          <div className='grid gap-4 md:gap-6'>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className='p-6'>
                <div className='flex justify-between items-start mb-4'>
                  <Skeleton className='h-6 w-3/4' />
                  <Skeleton className='h-6 w-20' />
                </div>
                <Skeleton className='h-4 w-full mb-2' />
                <Skeleton className='h-4 w-1/2' />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <Card className='w-full max-w-md p-8 text-center shadow-xl'>
          <div className='mb-4'>
            <div className='w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4'>
              <ExternalLink className='w-8 h-8 text-destructive' />
            </div>
            <h1 className='text-2xl font-bold text-destructive mb-2'>Błąd</h1>
            <p className='text-muted-foreground mb-6'>{error}</p>
          </div>
          <Button
            onClick={() => router.push('/')}
            variant='outline'
            className='cursor-pointer'
          >
            Powrót do strony głównej
          </Button>
        </Card>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <>
      {/* Header */}
      <div className='mb-8 bg-card rounded-lg border overflow-hidden'>
        <div className='bg-gradient-to-r from-primary/10 to-secondary/10 p-6'>
          <div className='flex items-center gap-5'>
            <Avatar className='w-16 h-16 border-2 border-primary/30 shadow-md'>
              <AvatarImage
                src={organization.image_url || undefined}
                alt={organization.name}
              />
              <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white text-2xl font-bold'>
                {getInitials(organization.name)}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1'>
              <h1 className='text-2xl font-bold display-font'>
                {organization.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-background/50'>
          <div className='flex flex-col items-center p-2 text-center'>
            <span className='text-2xl font-bold text-primary'>
              {events.length}
            </span>
            <span className='text-xs text-muted-foreground'>
              Wszystkie wydarzenia
            </span>
          </div>
          <div className='flex flex-col items-center p-2 text-center'>
            <span className='text-2xl font-bold text-primary'>
              {
                sortedEvents.filter((event) => isUpcoming(event.starts_at))
                  .length
              }
            </span>
            <span className='text-xs text-muted-foreground'>
              Wszystkie wydarzenia
            </span>
          </div>
          <div className='flex flex-col items-center p-2 text-center'>
            <span className='text-2xl font-bold text-primary'>
              {
                sortedEvents.filter((event) => !isUpcoming(event.starts_at))
                  .length
              }
            </span>
            <span className='text-xs text-muted-foreground'>Zakończone</span>
          </div>
          <div className='flex flex-col items-center p-2 text-center'>
            <span className='text-2xl font-bold text-primary'>
              {events.filter((event) => event.verified).length}
            </span>
            <span className='text-xs text-muted-foreground'>Zweryfikowane</span>
          </div>
        </div>
      </div>

      {/* Events Header */}
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold display-font'>Wydarzenia</h2>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            onClick={() => router.push(`/org/${orgSlug}/settings`)}
            className='cursor-pointer flex items-center gap-2'
          >
            <Settings className='w-4 h-4' />
            <span>Ustawienia</span>
          </Button>
          <Button
            variant='default'
            onClick={() => router.push(`/org/${orgSlug}/add`)}
            className='cursor-pointer flex items-center gap-2'
          >
            <PlusCircle className='w-4 h-4' />
            <span>Dodaj wydarzenie</span>
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <div className='mb-8'>
        <div className='flex items-center space-x-4 p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm'>
          <Filter className='w-5 h-5 text-muted-foreground' />
          <span className='text-sm font-medium text-muted-foreground'>
            Filtruj:
          </span>
          <div className='flex space-x-2'>
            {[
              { key: 'all', label: 'Wszystkie', count: events.length },
              {
                key: 'verified',
                label: 'Zweryfikowane',
                count: events.filter((e) => e.verified).length,
              },
              {
                key: 'unverified',
                label: 'Niezweryfikowane',
                count: events.filter((e) => !e.verified).length,
              },
            ].map((filterOption) => (
              <Button
                key={filterOption.key}
                variant={filter === filterOption.key ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setFilter(filterOption.key as FilterType)}
                className={`cursor-pointer transition-all duration-200 ${
                  filter === filterOption.key
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:from-primary/90 hover:to-secondary/90 hover:shadow-lg'
                    : 'hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:text-primary border-transparent hover:border-primary/20'
                }`}
              >
                {filterOption.label}
                <Badge
                  variant='secondary'
                  className={`ml-2 text-xs transition-colors duration-200 ${
                    filter === filterOption.key
                      ? 'bg-white/20 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {filterOption.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Section */}
      {filteredEvents.length === 0 ? (
        <Card className='p-12 text-center shadow-lg'>
          <div className='max-w-md mx-auto'>
            <div className='w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6'>
              <Calendar className='w-10 h-10 text-muted-foreground' />
            </div>
            <h3 className='text-xl font-semibold mb-3'>
              {filter === 'all'
                ? 'Brak wydarzeń'
                : filter === 'verified'
                ? 'Brak zweryfikowanych wydarzeń'
                : 'Brak niezweryfikowanych wydarzeń'}
            </h3>
            <p className='text-muted-foreground mb-6'>
              {filter === 'all'
                ? 'Dodaj pierwsze wydarzenie dla swojej organizacji'
                : 'Zmień filtr aby zobaczyć inne wydarzenia'}
            </p>
            <Button
              onClick={() => router.push(`/org/${orgSlug}/add`)}
              className='cursor-pointer'
            >
              <PlusCircle className='w-4 h-4 mr-2' />
              Dodaj wydarzenie
            </Button>
          </div>
        </Card>
      ) : (
        <div className='w-full'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {sortedEvents.map((event) => {
              const isEventToday =
                new Date(event.starts_at).toDateString() ===
                new Date().toDateString();

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
                <div
                  key={event.id}
                  className='border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group bg-card'
                >
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
                        Zatwierdzony
                      </>
                    ) : (
                      <>
                        <Clock3 className='h-3 w-3' />
                        Oczekuje na weryfikację
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
                              onClick={() =>
                                handleMapLinkClick(event.location!)
                              }
                              className='font-medium hover:underline flex items-center gap-1 cursor-pointer'
                              title='Otwórz w aplikacji map'
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
                                  Pokaż więcej
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

                      {/* External Link Button */}
                      {event.url && (
                        <div className='mt-3'>
                          <a
                            href={event.url}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <Button
                              variant='default'
                              size='sm'
                              className='w-full flex items-center gap-2 transition-all duration-300 cursor-pointer'
                            >
                              <ExternalLink className='h-4 w-4' />
                              Odwiedź stronę wydarzenia
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='h-px bg-border sm:hidden mt-2 mb-2'></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
