import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the appropriate date-fns locale based on the current application locale
 */
export function getDateFnsLocale(locale: string) {
  switch (locale) {
    case 'en':
      return enUS;
    case 'pl':
    default:
      return pl;
  }
}

/**
 * Format a date string using the appropriate locale
 */
export function formatLocalizedDate(
  dateString: string,
  formatPattern: string,
  locale: string
) {
  const date = parseISO(dateString);
  const dateFnsLocale = getDateFnsLocale(locale);
  return format(date, formatPattern, { locale: dateFnsLocale });
}

/**
 * Format an event date range with localization
 */
export function formatEventDateRange(
  startsAt: string,
  endsAt: string,
  locale: string
) {
  const startDate = parseISO(startsAt);
  const endDate = parseISO(endsAt);
  const dateFnsLocale = getDateFnsLocale(locale);

  // Check if event spans multiple days
  const isSameDay =
    format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');

  if (isSameDay) {
    return format(startDate, 'd MMMM yyyy', { locale: dateFnsLocale });
  } else {
    return `${format(startDate, 'd MMMM', {
      locale: dateFnsLocale,
    })} - ${format(endDate, 'd MMMM yyyy', { locale: dateFnsLocale })}`;
  }
}

/**
 * Format event time range
 */
export function formatEventTimeRange(startsAt: string, endsAt: string) {
  const startDate = parseISO(startsAt);
  const endDate = parseISO(endsAt);

  const startTime = format(startDate, 'HH:mm');
  const endTime = format(endDate, 'HH:mm');

  return `${startTime} - ${endTime}`;
}
