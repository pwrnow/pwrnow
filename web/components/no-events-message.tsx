import { CalendarX } from 'lucide-react';

export default function NoEventsMessage() {
  return (
    <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-4 py-12 text-center'>
      <div className='flex flex-col items-center space-y-4'>
        <div className='p-4 rounded-full bg-muted'>
          <CalendarX className='h-8 w-8 text-muted-foreground' />
        </div>
        <div className='space-y-2'>
          <h3 className='text-lg font-semibold'>Brak wydarzeń</h3>
          <p className='text-muted-foreground'>
            Nie znaleziono wydarzeń w tej kategorii. Sprawdź inne kategorie lub
            spróbuj ponownie później.
          </p>
        </div>
      </div>
    </div>
  );
}
