import { Check, X, MoreHorizontal, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Przykładowe dane wydarzeń dla demonstracji
const events = [
  {
    id: '1',
    title: 'Konferencja technologiczna',
    startDate: '2023-12-10',
    endDate: '2023-12-12',
    location: 'Warszawa',
    category: 'Technologia',
    verified: false,
  },
  {
    id: '2',
    title: 'Warsztaty UX/UI Design',
    startDate: '2023-11-15',
    endDate: '2023-11-15',
    location: 'Kraków',
    category: 'Design',
    verified: true,
  },
  {
    id: '3',
    title: 'Festiwal Kultury',
    startDate: '2023-10-05',
    endDate: '2023-10-10',
    location: 'Wrocław',
    category: 'Kultura',
    verified: true,
  },
  {
    id: '4',
    title: 'Koncert muzyki klasycznej',
    startDate: '2023-09-20',
    endDate: '2023-09-20',
    location: 'Poznań',
    category: 'Muzyka',
    verified: false,
  },
  {
    id: '5',
    title: 'Targi pracy IT',
    startDate: '2023-08-15',
    endDate: '2023-08-16',
    location: 'Gdańsk',
    category: 'Kariera',
    verified: false,
  },
  {
    id: '6',
    title: 'Hackathon programistyczny',
    startDate: '2023-07-01',
    endDate: '2023-07-03',
    location: 'Łódź',
    category: 'Technologia',
    verified: true,
  },
];

export default function EventsPage() {
  return (
    <>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Wydarzenia</h1>
          <p className='text-muted-foreground'>
            Zarządzaj wydarzeniami i ich weryfikacją
          </p>
        </div>
        <Button>
          <Calendar className='mr-2 h-4 w-4' />
          Dodaj wydarzenie
        </Button>
      </div>

      <div className='flex items-center gap-2'>
        <div className='relative flex-1'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            type='search'
            placeholder='Szukaj wydarzeń...'
            className='pl-8'
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>Filtry</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-[200px]'>
            <DropdownMenuLabel>Status weryfikacji</DropdownMenuLabel>
            <DropdownMenuItem>Wszystkie</DropdownMenuItem>
            <DropdownMenuItem>Zweryfikowane</DropdownMenuItem>
            <DropdownMenuItem>Niezweryfikowane</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Kategorie</DropdownMenuLabel>
            <DropdownMenuItem>Wszystkie</DropdownMenuItem>
            <DropdownMenuItem>Technologia</DropdownMenuItem>
            <DropdownMenuItem>Design</DropdownMenuItem>
            <DropdownMenuItem>Kultura</DropdownMenuItem>
            <DropdownMenuItem>Muzyka</DropdownMenuItem>
            <DropdownMenuItem>Kariera</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead>Data rozpoczęcia</TableHead>
                <TableHead>Data zakończenia</TableHead>
                <TableHead>Lokalizacja</TableHead>
                <TableHead>Kategoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className='font-medium'>{event.title}</TableCell>
                  <TableCell>{event.startDate}</TableCell>
                  <TableCell>{event.endDate}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{event.category}</TableCell>
                  <TableCell>
                    {event.verified ? (
                      <Badge
                        variant='outline'
                        className='bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700'
                      >
                        Zweryfikowane
                      </Badge>
                    ) : (
                      <Badge
                        variant='outline'
                        className='bg-yellow-50 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-700'
                      >
                        Oczekujące
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-2'>
                      <TooltipProvider>
                        {!event.verified ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size='icon'
                                variant='ghost'
                                className='h-8 w-8 text-green-600'
                              >
                                <Check className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Weryfikuj</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size='icon'
                                variant='ghost'
                                className='h-8 w-8 text-red-600'
                              >
                                <X className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Usuń weryfikację</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size='icon'
                            variant='ghost'
                            className='h-8 w-8'
                          >
                            <MoreHorizontal className='h-4 w-4' />
                            <span className='sr-only'>Więcej opcji</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                          <DropdownMenuItem>Zobacz szczegóły</DropdownMenuItem>
                          <DropdownMenuItem>Edytuj</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className='text-red-600'>
                            Usuń
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
