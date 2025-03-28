'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteEvent } from '@/app/actions/events';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface DeleteEventButtonProps {
  eventId: string;
  organizationId: string;
  eventTitle: string;
}

export default function DeleteEventButton({
  eventId,
  organizationId,
  eventTitle,
}: DeleteEventButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteEvent(eventId, organizationId);

      if (result.success) {
        toast({
          title: 'Sukces',
          description: 'Wydarzenie zostało usunięte',
          variant: 'default',
        });
        // Force a refresh of the page
        router.refresh();
      } else {
        toast({
          title: 'Błąd',
          description: result.error || 'Nie udało się usunąć wydarzenia',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Wystąpił nieoczekiwany błąd podczas usuwania wydarzenia',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant='outline'
          size='icon'
          className='text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30'
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Czy na pewno chcesz usunąć to wydarzenie?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Zamierzasz usunąć wydarzenie{' '}
            <span className='font-medium'>"{eventTitle}"</span>. Ta akcja jest
            nieodwracalna i spowoduje trwałe usunięcie wydarzenia.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isDeleting ? 'Usuwanie...' : 'Usuń wydarzenie'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
