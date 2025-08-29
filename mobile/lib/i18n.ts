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
    // Event detail page translations
    eventDescription: 'Event description',
    posts: 'Posts',
    schedule: 'Schedule',
    noPosts: 'No posts',
    noSchedule: 'No schedule',
    noPostsDescription: 'Posts about this event will appear here',
    noScheduleDescription: 'Detailed event schedule will appear here',
    backToHome: 'Back to home page',
    failedToLoadEvent: 'Failed to load event',
    visitEventPage: 'Visit event page',
    ok: 'OK',
    // Additional translations for event detail page
    details: 'Details',
    justNow: 'Just now',
    loadMorePosts: 'Load more posts',
    scheduleNote: 'Important note',
    scheduleNoteDescription:
      'The schedule may change. Please check for updates.',
    eventDetails: 'Event details',
    allEventDetailsDisplayed: 'All event information is displayed above.',
    tryAgainLater: 'Please try again later.',
    // Authentication translations
    welcomeBack: 'Welcome Back!',
    signInToContinue: 'Sign in to continue',
    continueWithGoogle: 'Continue with Google',
    continueWithApple: 'Continue with Apple',
    bySigningInYouAgree: 'By signing in, you agree to our Terms of Service',
    signOut: 'Sign Out',
    areYouSureSignOut: 'Are you sure you want to sign out?',
    signOutError: 'Failed to sign out. Please try again.',
    error: 'Error',
    user: 'User',
    profileInformation: 'Profile Information',
    name: 'Name',
    email: 'Email',
    memberSince: 'Member Since',
    notProvided: 'Not provided',
    accountActions: 'Account Actions',
    helpAndSupport: 'Help & Support',
    comingSoon: 'Coming Soon',
    settingsComingSoon: 'Settings will be available soon',
    helpComingSoon: 'Help & Support will be available soon',
    // Sign in screen specific translations
    unlockFullExperience: 'Unlock the full experience',
    signInDescription:
      'Sign in to access exclusive features and personalize your PWr Now experience',
    loading: 'Loading...',
    // Authentication modal translations
    signInRequiredTitle: 'Sign in to unlock',
    signInRequiredMessage: 'Sign in to use favorites and other features.',
    signIn: 'Sign In',
    // New translations for event details page
    newEvent: 'New event',
    recentlyAdded: 'Recently added',
    eventTime: 'Event time',
    location: 'Location',
    // Dummy data translations
    eventOrganizer: 'Event organizer',
    registration: 'Registration',
    openingCeremony: 'Opening ceremony',
    mainPresentation: 'Main presentation',
    coffeeBreak: 'Coffee break',
    discussionPanel: 'Discussion panel',
    lunchBreak: 'Lunch break',
    participantRegistration: 'Participant registration',
    welcomeParticipants: 'Welcome participants and event introduction',
    latestTrends: 'Latest industry trends and future development',
    networking: 'Networking and refreshments',
    challengesOpportunities:
      'Challenges and opportunities in current market situation',
    expertPanel: 'Panel of experts',
    sharedMeal: 'Shared meal and continued networking',
    welcomeAllParticipants:
      'Welcome all participants! We cannot wait for the amazing event. We have prepared many surprises for you!',
    excitedToParticipate:
      'I am very excited to participate in this event! Who else will be there?',
    greatOrganization:
      'Great organization! I recommend it to everyone interested in the topic.',
    live: 'LIVE',
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
    // Event detail page translations
    eventDescription: 'Opis wydarzenia',
    posts: 'Posty',
    schedule: 'Harmonogram',
    noPosts: 'Brak postów',
    noSchedule: 'Brak harmonogramu',
    noPostsDescription: 'Posty dotyczące tego wydarzenia pojawią się tutaj',
    noScheduleDescription:
      'Szczegółowy harmonogram wydarzenia pojawi się tutaj',
    backToHome: 'Wróć do strony głównej',
    failedToLoadEvent: 'Nie udało się załadować wydarzenia',
    visitEventPage: 'Odwiedź stronę wydarzenia',
    ok: 'OK',
    // Additional translations for event detail page
    details: 'Szczegóły',
    justNow: 'Teraz',
    loadMorePosts: 'Załaduj więcej postów',
    scheduleNote: 'Ważna informacja',
    scheduleNoteDescription:
      'Harmonogram może ulec zmianie. Sprawdzaj aktualizacje.',
    eventDetails: 'Szczegóły wydarzenia',
    allEventDetailsDisplayed:
      'Wszystkie informacje o wydarzeniu są wyświetlone powyżej.',
    tryAgainLater: 'Spróbuj ponownie później.',
    // Authentication translations
    welcomeBack: 'Witaj ponownie!',
    signInToContinue: 'Zaloguj się, aby kontynuować',
    continueWithGoogle: 'Kontynuuj z Google',
    continueWithApple: 'Kontynuuj z Apple',
    bySigningInYouAgree: 'Logując się, akceptujesz nasze Warunki Korzystania',
    signOut: 'Wyloguj się',
    areYouSureSignOut: 'Czy na pewno chcesz się wylogować?',
    signOutError: 'Nie udało się wylogować. Spróbuj ponownie.',
    error: 'Błąd',
    user: 'Użytkownik',
    profileInformation: 'Informacje o profilu',
    name: 'Imię',
    email: 'Email',
    memberSince: 'Członek od',
    notProvided: 'Nie podano',
    accountActions: 'Akcje konta',
    helpAndSupport: 'Pomoc i wsparcie',
    comingSoon: 'Wkrótce',
    settingsComingSoon: 'Ustawienia będą dostępne wkrótce',
    helpComingSoon: 'Pomoc i wsparcie będą dostępne wkrótce',
    // Sign in screen specific translations
    unlockFullExperience: 'Odblokuj pełne doświadczenie',
    signInDescription:
      'Zaloguj się, aby uzyskać dostęp do ekskluzywnych funkcji i spersonalizować swoje doświadczenie PWr Now',
    loading: 'Ładowanie...',
    // Authentication modal translations
    signInRequiredTitle: 'Zaloguj się, aby odblokować',
    signInRequiredMessage:
      'Zaloguj się, aby korzystać z ulubionych i innych funkcji.',
    signIn: 'Zaloguj się',
    // New translations for event details page
    newEvent: 'Nowe wydarzenie',
    recentlyAdded: 'Ostatnio dodane',
    eventTime: 'Czas wydarzenia',
    location: 'Lokalizacja',
    // Dummy data translations
    eventOrganizer: 'Organizator wydarzenia',
    registration: 'Rejestracja',
    openingCeremony: 'Otwarcie ceremonii',
    mainPresentation: 'Główne wystąpienie',
    coffeeBreak: 'Przerwa kawowa',
    discussionPanel: 'Panel dyskusyjny',
    lunchBreak: 'Przerwa na obiad',
    participantRegistration: 'Rejestracja uczestników',
    welcomeParticipants: 'Witajcie uczestnicy i wprowadzenie do wydarzenia',
    latestTrends: 'Najnowsze trendy w branży i przyszłe rozwój',
    networking: 'Networking i przekąski',
    challengesOpportunities:
      'Wyzwania i możliwości w obecnej sytuacji rynkowej',
    expertPanel: 'Panel ekspertów',
    sharedMeal: 'Obiad wspólny i kontynuacja networkingu',
    welcomeAllParticipants:
      'Witajcie wszystkie uczestnicy! Nie możemy się doczekać niesamowitego wydarzenia. Przygotowaliśmy wiele niespodzianek dla was!',
    excitedToParticipate:
      'Jestem bardzo podekscytowany, aby wziąć udział w tym wydarzeniu! Kto jeszcze tam będzie?',
    greatOrganization:
      'Świetna organizacja! Polecam ją każdemu zainteresowanemu tematem.',
    live: 'NA ŻYWO',
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
