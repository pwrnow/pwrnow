import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

type TranslationMap = Record<string, string>;

const translations: Record<string, TranslationMap> = {
  en: {
    all: 'All',
    refreshingEvents: 'Refreshing events...',
    noEventsAll: 'No events are available right now.',
    noEventsInCategory: 'No events in this category.',
    showAllEvents: 'Show all events',
    permissionDeniedTitle: 'Permission denied',
    permissionDeniedMessage:
      'The app needs access to your calendar to add the event.',
    cancel: 'Cancel',
    settings: 'Settings',
    successTitle: 'Success!',
    eventAddedToCalendar:
      'The event "{{title}}" has been added to your calendar.',
    errorTitle: 'Error',
    calendarOpenFailed: 'Unable to open the calendar. Please try again.',
    moreInfo: 'More information',
    shareEvent: 'Share event',
    share: 'Share',
    collapse: 'Collapse',
    expand: 'Expand',
    visitPage: 'Visit page',
    newTag: 'NEW',
  },
  pl: {
    all: 'Wszystkie',
    refreshingEvents: 'Odświeżanie wydarzeń...',
    noEventsAll: 'Aktualnie brak dostępnych wydarzeń.',
    noEventsInCategory: 'Brak wydarzeń w tej kategorii.',
    showAllEvents: 'Pokaż wszystkie wydarzenia',
    permissionDeniedTitle: 'Brak uprawnień',
    permissionDeniedMessage:
      'Aplikacja potrzebuje dostępu do kalendarza, aby dodać wydarzenie.',
    cancel: 'Anuluj',
    settings: 'Ustawienia',
    successTitle: 'Sukces!',
    eventAddedToCalendar:
      'Wydarzenie "{{title}}" zostało dodane do kalendarza.',
    errorTitle: 'Błąd',
    calendarOpenFailed: 'Nie udało się otworzyć kalendarza. Spróbuj ponownie.',
    moreInfo: 'Więcej informacji',
    shareEvent: 'Udostępnij wydarzenie',
    share: 'Udostępnij',
    collapse: 'Zwiń',
    expand: 'Rozwiń',
    visitPage: 'Odwiedź stronę',
    newTag: 'NOWE',
  },
};

export const i18n = new I18n(translations);

const deviceLanguageCode = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = deviceLanguageCode;
i18n.enableFallback = true;

export const t = (key: keyof TranslationMap, options?: Record<string, any>) =>
  i18n.t(key as string, options);

export const deviceLocaleTag: string =
  getLocales()[0]?.languageTag ??
  (deviceLanguageCode === 'pl' ? 'pl-PL' : 'en-US');

export default i18n;
