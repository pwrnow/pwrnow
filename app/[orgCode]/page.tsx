import { notFound } from 'next/navigation';
import Link from 'next/link';
import EventCard from '@/components/event-card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
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
    <div className='max-w-2xl mx-auto px-4 py-4'>
      {/* Organization Header */}
      <div className='flex flex-col items-center mb-8'>
        <Avatar className='w-24 h-24 border-2 border-primary/30 mb-4'>
          <AvatarImage
            src={organization.image_url || undefined}
            alt={organization.name}
          />
          <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white text-3xl font-bold'>
            {orgInitials}
          </AvatarFallback>
        </Avatar>
        <h1 className='text-3xl font-bold text-center mb-2'>
          {organization.name}
        </h1>
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
          <Link href={`/${orgId}/add-event`}>
            <Button>Dodaj pierwsze wydarzenie</Button>
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  );
}
