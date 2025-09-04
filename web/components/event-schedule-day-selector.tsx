'use client';

import React from 'react';

interface DayOption {
  id: string; // YYYY-MM-DD
  label: string; // e.g., Mon 12
  isToday: boolean;
  isPast: boolean;
}

interface Props {
  days: DayOption[];
  selectedDay: string;
  onSelect: (dayId: string) => void;
}

export default function EventScheduleDaySelector({
  days,
  selectedDay,
  onSelect,
}: Props) {
  if (days.length === 0) return null;

  return (
    <div className='flex gap-2 overflow-x-auto pb-2 -mx-1 px-1'>
      {days.map((day) => {
        const isSelected = day.id === selectedDay;
        const base = 'px-3 py-2 rounded-xl border text-sm whitespace-nowrap';
        const selected = day.isToday
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-blue-600 text-white border-blue-600';
        const notSelected = day.isPast
          ? 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-foreground'
          : day.isToday
          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-900/50 text-foreground'
          : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-foreground';

        return (
          <button
            key={day.id}
            onClick={() => onSelect(day.id)}
            className={`${base} ${isSelected ? selected : notSelected}`}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}

export type { DayOption };
