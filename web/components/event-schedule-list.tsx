'use client';

import React from 'react';
import { ScheduleItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, Trash2 } from 'lucide-react';

interface Props {
  items: ScheduleItem[];
  canDelete?: boolean;
  onDelete?: (id: string) => void;
}

export default function EventScheduleList({
  items,
  canDelete,
  onDelete,
}: Props) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className='space-y-3'>
      {items.map((item) => (
        <Card
          key={item.id}
          className='relative p-4 flex items-start gap-3 shadow-sm border border-black/10 dark:border-white/10 rounded-2xl'
        >
          <div className='flex items-start gap-3 pr-8'>
            <div className='flex flex-col items-center w-16'>
              <div className='px-2 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-semibold'>
                {formatTime(item.start_time)}
              </div>
              <div className='text-[10px] text-muted-foreground mt-1'>
                {getDuration(item.start_time, item.end_time)}
              </div>
            </div>
            <div>
              <div className='font-semibold'>{item.title}</div>
              {item.description && (
                <div className='text-sm text-muted-foreground mt-1 whitespace-pre-wrap'>
                  {item.description}
                </div>
              )}
            </div>
          </div>
          {canDelete && onDelete && (
            <Button
              variant='ghost'
              size='icon'
              onClick={() => onDelete(item.id)}
              className='text-destructive hover:text-destructive absolute top-2 right-2'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}

function formatTime(time: string) {
  // Expect HH:MM or HH:MM:SS
  const [h, m] = time.split(':');
  const date = new Date();
  date.setHours(Number(h), Number(m || 0), 0, 0);
  return date.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDuration(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + (sm || 0);
  const endMin = eh * 60 + (em || 0);
  const diff = Math.max(0, endMin - startMin);
  return `${diff} min`;
}
