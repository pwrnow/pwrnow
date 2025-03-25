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
    <div className='mb-8 border-b border-muted pb-4'>
      <div className='px-4 py-3 flex items-center space-x-3'>
        <Avatar className='h-10 w-10 ring-2 ring-secondary sm:h-12 sm:w-12'>
          <AvatarImage
            src={event.author.avatar || '/placeholder.svg'}
            alt={event.author.name}
          />
          <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white'>
            {event.author.name.substring(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className='flex-1'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3'>
            <span className='font-medium text-sm sm:text-base'>
              {event.author.name}
            </span>
            <Badge
              variant='outline'
              className='bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/50 text-xs w-fit'
            >
              {event.category}
            </Badge>
          </div>
        </div>
      </div>

      <div className='relative aspect-square w-full md:aspect-[4/3] lg:aspect-[16/9]'>
        <Image
          src={event.imageUrl || '/placeholder.svg'}
          alt={event.title}
          fill
          className='object-cover'
          sizes='(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw'
        />
      </div>

      <div className='px-4 pt-4'>
        <h2 className='text-xl font-bold display-font sm:text-2xl md:text-3xl mb-2'>
          {event.title}
        </h2>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4'>
          <div className='flex items-center text-sm'>
            <Calendar className='h-5 w-5 mr-2 text-primary flex-shrink-0' />
            <span className='font-medium'>{event.date}</span>
          </div>
          <div className='flex items-center text-sm'>
            <Clock className='h-5 w-5 mr-2 text-primary flex-shrink-0' />
            <span className='font-medium'>{event.time}</span>
          </div>
          <div className='flex items-center text-sm'>
            <MapPin className='h-5 w-5 mr-2 text-primary flex-shrink-0' />
            <span className='font-medium truncate'>{event.location}</span>
          </div>
        </div>

        {event.description && (
          <p className='text-muted-foreground mb-4 leading-relaxed text-sm sm:text-base'>
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
}
