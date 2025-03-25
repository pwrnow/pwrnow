import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
  category: string;
  author: {
    name: string;
    avatar: string;
  };
}

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className='mb-8 border-0 sm:border sm:rounded-lg sm:shadow-sm'>
      <div className='flex flex-col'>
        <div className='px-3 py-2 sm:px-4 sm:py-3 flex items-center space-x-2 sm:space-x-3'>
          <Avatar className='h-8 w-8 sm:h-10 sm:w-10 ring-1 ring-secondary'>
            <AvatarImage
              src={event.author.avatar || '/placeholder.svg'}
              alt={event.author.name}
            />
            <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white'>
              {event.author.name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <div className='flex items-center justify-between'>
              <span className='font-medium text-sm sm:text-base truncate'>
                {event.author.name}
              </span>
              <Badge
                variant='outline'
                className='bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/50 text-xs sm:text-sm'
              >
                {event.category}
              </Badge>
            </div>
          </div>
        </div>

        <div className='relative aspect-square w-full'>
          <Image
            src={event.imageUrl || '/placeholder.svg'}
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

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 mb-3 sm:mb-4 text-xs sm:text-sm'>
            <div className='flex items-center'>
              <Calendar className='h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-muted-foreground flex-shrink-0' />
              <span className='font-medium'>{event.date}</span>
            </div>
            <div className='flex items-center'>
              <Clock className='h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-muted-foreground flex-shrink-0' />
              <span className='font-medium'>{event.time}</span>
            </div>
            <div className='flex items-center'>
              <MapPin className='h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-muted-foreground flex-shrink-0' />
              <span className='font-medium truncate'>{event.location}</span>
            </div>
          </div>

          {event.description && (
            <p className='text-muted-foreground leading-relaxed text-xs sm:text-sm mb-2 sm:mb-3'>
              {event.description}
            </p>
          )}
        </div>
      </div>

      <div className='h-px bg-border sm:hidden mt-2 mb-2'></div>
    </div>
  );
}
