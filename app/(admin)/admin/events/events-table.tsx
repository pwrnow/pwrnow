'use client';

import {
  Check,
  MoreHorizontal,
  Search,
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  Clock3,
  Navigation,
} from 'lucide-react';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  order_index: number | null;
}

interface Organization {
  id: string;
  name: string;
  image_url: string | null;
  code: string | null;
}

interface Event {
  id: string;
  starts_at: string;
  ends_at: string;
  title: string;
  description: string | null;
  image_url: string | null;
  location: string | null;
  verified: boolean;
  url: string | null;
  category_id: string | null;
  organization_id: string | null;
  category: Category | null;
  organization: Organization | null;
}

type VerificationFilter = 'all' | 'verified' | 'unverified';

interface UrlDialogProps {
  url: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

function UrlDialog({ url, isOpen, onOpenChange, onConfirm }: UrlDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Przejdź do zewnętrznej strony</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz przejść do: <br />
            <span className='font-medium break-all'>{url}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex gap-2 justify-end'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={onConfirm}>
            <ExternalLink className='mr-2 h-4 w-4' />
            Przejdź
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EventsTable({ events }: { events: Event[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>('all');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organization?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesVerification =
      verificationFilter === 'all' ||
      (verificationFilter === 'verified' && event.verified) ||
      (verificationFilter === 'unverified' && !event.verified);

    return matchesSearch && matchesVerification;
  });

  const handleUrlClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setSelectedUrl(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      <div className='flex items-center gap-2 mb-6'>
        <div className='relative flex-1'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            type='search'
            placeholder='Szukaj wydarzeń...'
            className='pl-8'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>
              Filtry
              {verificationFilter !== 'all' && (
                <Badge variant='secondary' className='ml-2'>
                  {verificationFilter === 'verified'
                    ? 'Zweryfikowane'
                    : 'Niezweryfikowane'}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-[200px]'>
            <DropdownMenuLabel>Status weryfikacji</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setVerificationFilter('all')}>
              Wszystkie
              {verificationFilter === 'all' && (
                <Check className='ml-auto h-4 w-4' />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVerificationFilter('verified')}>
              Zweryfikowane
              {verificationFilter === 'verified' && (
                <Check className='ml-auto h-4 w-4' />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setVerificationFilter('unverified')}
            >
              Niezweryfikowane
              {verificationFilter === 'unverified' && (
                <Check className='ml-auto h-4 w-4' />
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredEvents.map((event) => {
          const startsAt = parseISO(event.starts_at);
          const endsAt = parseISO(event.ends_at);
          const dateString = format(startsAt, 'd MMMM yyyy', { locale: pl });
          const startTimeString = format(startsAt, 'HH:mm');
          const endTimeString = format(endsAt, 'HH:mm');
          const timeString = `${startTimeString} - ${endTimeString}`;
          const organizationName = event.organization?.name || 'Wydarzenie';
          const organizationImageUrl = event.organization?.image_url;
          const categoryName = event.category?.name || 'Wydarzenie';
          const orgInitials = getInitials(organizationName);

          return (
            <div
              key={event.id}
              className='border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group'
            >
              <div
                className={cn(
                  'w-full py-1 px-3 text-xs font-medium flex items-center justify-between',
                  event.verified
                    ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                )}
              >
                <div className='flex items-center gap-1'>
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
                <div className='flex items-center gap-2'>
                  <TooltipProvider>
                    {!event.verified && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size='icon'
                            variant='ghost'
                            className='h-6 w-6 text-green-600'
                          >
                            <Check className='h-3 w-3' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Weryfikuj</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size='icon' variant='ghost' className='h-6 w-6'>
                        <MoreHorizontal className='h-3 w-3' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                      <DropdownMenuItem className='text-red-600'>
                        Usuń
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className='flex flex-col'>
                <div className='px-3 py-2 flex items-center space-x-3'>
                  <Avatar className='h-10 w-10 border border-primary/20 ring-offset-background transition-all duration-300 group-hover:shadow-sm'>
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
                      <span className='font-medium text-base truncate'>
                        {organizationName}
                      </span>
                      {event.category && (
                        <Badge
                          variant='outline'
                          className='bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/50'
                        >
                          {categoryName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className='relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-900'>
                  <Image
                    src={event.image_url || '/placeholder.svg'}
                    alt={event.title}
                    fill
                    className='object-contain transition-transform duration-500'
                    sizes='(max-width: 640px) 100vw, (max-width: 768px) 540px, (max-width: 1024px) 680px, 768px'
                    priority
                  />
                </div>

                <div className='px-3 pt-3 pb-4'>
                  <h2 className='text-xl font-bold display-font mb-3'>
                    {event.url ? (
                      <Button
                        variant='link'
                        className='h-auto p-0 text-xl font-bold'
                        onClick={() => event.url && setSelectedUrl(event.url)}
                      >
                        {event.title}
                      </Button>
                    ) : (
                      event.title
                    )}
                  </h2>

                  <div className='flex flex-col space-y-2 text-sm'>
                    <div className='flex items-center'>
                      <div className='p-1.5 rounded-md bg-blue-100 dark:bg-blue-950 mr-2'>
                        <Calendar className='h-4 w-4 text-blue-700 dark:text-blue-300' />
                      </div>
                      <span>{dateString}</span>
                    </div>

                    <div className='flex items-center'>
                      <div className='p-1.5 rounded-md bg-blue-100 dark:bg-blue-950 mr-2'>
                        <Clock className='h-4 w-4 text-blue-700 dark:text-blue-300' />
                      </div>
                      <span>{timeString}</span>
                    </div>

                    {event.location && (
                      <div className='flex items-center'>
                        <div className='p-1.5 rounded-md bg-blue-100 dark:bg-blue-950 mr-2'>
                          <MapPin className='h-4 w-4 text-blue-700 dark:text-blue-300' />
                        </div>
                        <span className='flex-1 truncate'>
                          {event.location}
                        </span>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='ml-2 h-7 w-7'
                          onClick={() => {
                            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              event.location || ''
                            )}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <Navigation className='h-4 w-4' />
                        </Button>
                      </div>
                    )}

                    {event.url && (
                      <div className='flex items-center'>
                        <div className='p-1.5 rounded-md bg-blue-100 dark:bg-blue-950 mr-2'>
                          <ExternalLink className='h-4 w-4 text-blue-700 dark:text-blue-300' />
                        </div>
                        <Button
                          variant='link'
                          className='h-auto p-0 text-sm font-normal'
                          onClick={() => setSelectedUrl(event.url)}
                        >
                          <span className='truncate text-left'>
                            {event.url}
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedUrl && (
        <UrlDialog
          url={selectedUrl}
          isOpen={!!selectedUrl}
          onOpenChange={(open) => !open && setSelectedUrl(null)}
          onConfirm={() => handleUrlClick(selectedUrl)}
        />
      )}
    </>
  );
}
