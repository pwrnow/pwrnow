import Image from 'next/image';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  image_url: string | null;
  url: string | null;
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
}

export default function EventCard({
  event,
  showOrganization = false,
}: EventCardProps) {
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

  return (
    <div className='mb-8 border-0 sm:border sm:rounded-lg sm:shadow-sm'>
      <div className='flex flex-col'>
        <div className='px-3 py-2 sm:px-4 sm:py-3 flex items-center space-x-2 sm:space-x-3'>
          <Avatar className='h-8 w-8 sm:h-10 sm:w-10 border border-primary/20'>
            <AvatarImage
              src={organizationImageUrl || undefined}
              alt={organizationName}
            />
            <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white font-medium'>
              {orgInitials}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <div className='flex items-center justify-between'>
              <span className='font-medium text-sm sm:text-base truncate'>
                {organizationName}
              </span>
              {event.category && (
                <Badge
                  variant='outline'
                  className='bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/50 text-xs sm:text-sm'
                >
                  {categoryName}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className='relative aspect-square w-full'>
          <Image
            src={event.image_url || '/placeholder.svg'}
            alt={event.title}
            fill
            className='object-cover'
            sizes='(max-width: 640px) 100vw, (max-width: 768px) 540px, (max-width: 1024px) 680px, 768px'
            priority
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
                <span className='font-medium'>{event.location}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className='text-muted-foreground leading-relaxed text-xs sm:text-sm mb-3 sm:mb-4'>
              {event.description}
            </p>
          )}

          {event.url && (
            <div className='mt-3'>
              <Link href={event.url} target='_blank' rel='noopener noreferrer'>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full flex items-center gap-2'
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
