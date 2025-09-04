'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings } from 'lucide-react';
import { getCurrentOrganization, getEvents } from '@/lib/api';
import { Organization, Event } from '@/lib/types';
import { useTranslations } from 'next-intl';
import OrganizationHeader from '@/components/organization-header';
import OrganizationStats from '@/components/organization-stats';
import EventCard from '@/components/event-card';
import EventsEmptyState from '@/components/events-empty-state';
import OrganizationPageSkeleton from '@/components/organization-page-skeleton';
import ErrorState from '@/components/error-state';
import { isUpcoming } from '@/lib/organization-utils';

export default function OrganizationPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const t = useTranslations('OrganizationPage');

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            setError(t('accessDenied'));
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
        setError(t('loadError'));
      } finally {
        setLoading(false);
      }
    }

    if (orgSlug) {
      loadOrganizationData();
    }
  }, [orgSlug, router, t]);

  const upcomingEvents = events.filter((event) => isUpcoming(event.starts_at));
  const pastEvents = events.filter((event) => !isUpcoming(event.starts_at));
  const sortedEvents = [...upcomingEvents.reverse(), ...pastEvents.reverse()];

  const handleEventDeleted = (eventSlug: string) => {
    setEvents(events.filter((event) => event.slug !== eventSlug));
  };

  if (loading) {
    return <OrganizationPageSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!organization) {
    return null;
  }

  return (
    <div className='w-full mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-8'>
      {/* Header */}
      <OrganizationHeader organization={organization} />

      {/* Statistics */}
      <OrganizationStats events={events} isUpcoming={isUpcoming} />

      {/* Events Header */}
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold display-font'>{t('events')}</h2>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            onClick={() => router.push(`/org/${orgSlug}/settings`)}
            className='cursor-pointer flex items-center gap-2'
          >
            <Settings className='w-4 h-4' />
            <span>{t('settings')}</span>
          </Button>
          <Button
            variant='default'
            onClick={() => router.push(`/org/${orgSlug}/add`)}
            className='cursor-pointer flex items-center gap-2'
          >
            <PlusCircle className='w-4 h-4' />
            <span>{t('addEvent')}</span>
          </Button>
        </div>
      </div>

      {/* Events Section */}
      {events.length === 0 ? (
        <EventsEmptyState filter={'all'} orgSlug={orgSlug} />
      ) : (
        <div className='w-full'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {sortedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                orgSlug={orgSlug}
                onEventDeleted={handleEventDeleted}
                showManagementActions={true}
              />
            ))}
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
    </div>
  );
}
