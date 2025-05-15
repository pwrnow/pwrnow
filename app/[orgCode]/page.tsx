import { notFound } from 'next/navigation';
import Link from 'next/link';
import EventCard from '@/components/event-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { getOrganization } from '@/lib/organization';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PageProps {
  params: {
    orgCode: string;
  };
}

export default async function OrganizationPage({ params }: PageProps) {
  const { orgCode } = await params;
  const supabase = await createClient();

  const organization = await getOrganization(orgCode);

  if (!organization) {
    return notFound();
  }

  // Get organization initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const orgInitials = getInitials(organization.name);

  // Fetch events with category info
  const { data: events } = await supabase
    .from('events')
    .select(
      `
      *,
      category:categories(id, name, slug)
    `
    )
    .eq('organization_id', organization.id)
    .order('starts_at', { ascending: true });

  return (
    <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-4 py-4'>
      {/* Organization Header - Combined with events header for better layout */}
      <div className='mb-8 bg-card rounded-lg border overflow-hidden'>
        <div className='bg-gradient-to-r from-primary/10 to-secondary/10 p-6'>
          <div className='flex items-center gap-5'>
            <Avatar className='w-16 h-16 border-2 border-primary/30 shadow-md'>
              <AvatarImage
                src={organization.image_url || undefined}
                alt={organization.name}
              />
              <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white text-2xl font-bold'>
                {orgInitials}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1'>
              <h1 className='text-2xl font-bold'>{organization.name}</h1>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-background/50'>
          <div className='flex flex-col items-center p-2 text-center'>
            <span className='text-2xl font-bold text-primary'>
              {events?.length || 0}
            </span>
            <span className='text-xs text-muted-foreground'>
              Wszystkie wydarzenia
            </span>
          </div>

          <div className='flex flex-col items-center p-2 text-center'>
            <span className='text-2xl font-bold text-primary'>
              {events?.filter((event) => new Date(event.starts_at) > new Date())
                .length || 0}
            </span>
            <span className='text-xs text-muted-foreground'>Nadchodzące</span>
          </div>

          <div className='flex flex-col items-center p-2 text-center'>
            <span className='text-2xl font-bold text-primary'>
              {events?.filter(
                (event) => new Date(event.starts_at) <= new Date()
              ).length || 0}
            </span>
            <span className='text-xs text-muted-foreground'>Zakończone</span>
          </div>

          <div className='flex flex-col items-center p-2 text-center'>
            <span className='text-2xl font-bold text-primary'>
              {events?.filter((event) => event.verified).length || 0}
            </span>
            <span className='text-xs text-muted-foreground'>Zweryfikowane</span>
          </div>
        </div>
      </div>

      {/* Events Header */}
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold'>Wydarzenia</h2>
        <Link href={`/${orgCode}/add-event`}>
          <Button className='flex items-center gap-2'>
            <PlusCircle className='h-4 w-4' />
            <span>Dodaj wydarzenie</span>
          </Button>
        </Link>
      </div>

      {!events || events.length === 0 ? (
        <div className='text-center py-10 bg-muted/20 rounded-lg'>
          <p className='text-muted-foreground mb-4'>
            Brak wydarzeń do wyświetlenia
          </p>
          <Link href={`/${orgCode}/add-event`}>
            <Button>Dodaj pierwsze wydarzenie</Button>
          </Link>
        </div>
      ) : (
        <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-0 sm:px-4'>
          <div className='flex flex-col'>
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={{
                  ...event,
                  organization: {
                    id: organization.id,
                    name: organization.name,
                    image_url: organization.image_url,
                  },
                }}
                showVerificationStatus={true}
                allowDelete={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
