import { deviceLocaleTag, t } from './i18n';

export const formatDateRangeShort = (
  startString: string,
  endString: string
) => {
  const startDate = new Date(startString);
  const endDate = new Date(endString);
  const now = new Date();

  const sameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  const sameMonthAndYear =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth();

  const shouldShowYear =
    startDate.getFullYear() !== now.getFullYear() ||
    endDate.getFullYear() !== now.getFullYear() ||
    startDate.getFullYear() !== endDate.getFullYear();

  const locale = deviceLocaleTag;
  const monthLong = (d: Date) =>
    d.toLocaleDateString(locale, {
      month: 'long',
    });
  const day = (d: Date) => d.getDate();

  if (sameDay) {
    return `${day(startDate)} ${monthLong(startDate)}${
      shouldShowYear ? ` ${startDate.getFullYear()}` : ''
    }`;
  }

  if (sameMonthAndYear) {
    return `${day(startDate)}–${day(endDate)} ${monthLong(startDate)}${
      shouldShowYear ? ` ${startDate.getFullYear()}` : ''
    }`;
  }

  const startYearPart = shouldShowYear ? ` ${startDate.getFullYear()}` : '';
  const endYearPart = shouldShowYear ? ` ${endDate.getFullYear()}` : '';
  return `${day(startDate)} ${monthLong(startDate)}${startYearPart}–${day(
    endDate
  )} ${monthLong(endDate)}${endYearPart}`;
};

export const formatTimeRangeShort = (
  startString: string,
  endString: string
) => {
  const startDate = new Date(startString);
  const endDate = new Date(endString);

  const locale = deviceLocaleTag;
  const time = (d: Date) =>
    d.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });

  return `${time(startDate)}–${time(endDate)}`;
};

export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const formatPostTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours =
    Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return t('justNow');
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  }
};
