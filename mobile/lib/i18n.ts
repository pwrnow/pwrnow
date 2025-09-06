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
    loadingPosts: 'Loading posts...',
    failedToLoadPosts: 'Failed to load posts',
    noSchedule: 'No schedule',
    noScheduleItems: 'No schedule items',
    noScheduleItemsDescription: 'No schedule items for this day',
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
    // Apple sign-in specific translations
    appleSignInError: 'Apple Sign In Error',
    appleSignInFailed: 'Apple Sign In Failed',
    appleSignInGenericError: 'Please try again later.',
    appleSignInNotAvailable: 'Apple Sign In is not available on this device',
    appleSignInIOSOnly: 'Apple Sign In is only available on iOS devices',
    appleAuthenticationFailed: 'Apple authentication failed. Please try again.',
    appleAuthenticationRequestNotHandled:
      'Apple authentication request was not handled properly.',
    appleInvalidResponse: 'Invalid response from Apple. Please try again.',
    appleInvalidScope: 'Invalid authentication scope requested.',
    appleUnexpectedError: 'An unexpected error occurred during Apple sign-in.',
    appleSignInCanceled: 'Apple sign-in was canceled by user',
    signInError: 'Sign In Error',
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
    // Maps integration translations
    openLocation: 'Open Location',
    chooseMapApp: 'Choose which app to open the location with:',
    failedToOpenMaps: 'Failed to open maps. Please try again.',
    // Settings translations
    profile: 'Profile',
    notifications: 'Notifications',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    english: 'English',
    polish: 'Polish',
    notificationsDescription:
      'Receive push notifications about events and updates',
    languageDescription: 'Choose your preferred language',
    themeDescription: 'Choose your preferred theme',
    signInToAccessProfile: 'Sign in to access your profile',
    signInToAccessProfileDescription:
      'Sign in to save your preferences and access personalized features',
    // Social media translations
    connectWithUs: 'Connect with us',
    socialMediaDescription: 'Follow us on social media and get in touch',
    cannotOpenLink: 'Cannot open this link',
    contactUsForSupport: 'Need help? Reach out to us on social media',
    // Team section translations
    team: 'Team',
    meetOurTeam: 'Meet our team',
    teamDescription: 'Learn about the people behind PWr Now',
    // First like modal translations
    firstLikeTitle: 'Nice! You liked an event!',
    firstLikeSubtitle: "Here's what you get:",
    firstLikeBenefit1Title: 'Reminders',
    firstLikeBenefit1Description: 'Get notified before events start',
    firstLikeBenefit2Title: 'Updates',
    firstLikeBenefit2Description: 'Get posts and info about events you like',
    firstLikeBenefit3Title: 'Help organizers',
    firstLikeBenefit3Description: 'Show which events are interesting',
    firstLikeContinue: 'Got it!',
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
    loadingPosts: 'Ładowanie postów...',
    failedToLoadPosts: 'Nie udało się załadować postów',
    noSchedule: 'Brak harmonogramu',
    noScheduleItems: 'Brak elementów harmonogramu',
    noScheduleItemsDescription: 'Brak elementów harmonogramu na ten dzień',
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
    // Apple sign-in specific translations
    appleSignInError: 'Błąd logowania Apple',
    appleSignInFailed: 'Logowanie Apple nie powiodło się',
    appleSignInGenericError: 'Spróbuj ponownie później.',
    appleSignInNotAvailable:
      'Logowanie Apple jest niedostępne na tym urządzeniu',
    appleSignInIOSOnly:
      'Logowanie Apple jest dostępne tylko na urządzeniach iOS',
    appleAuthenticationFailed:
      'Uwierzytelnienie Apple nie powiodło się. Spróbuj ponownie.',
    appleAuthenticationRequestNotHandled:
      'Żądanie uwierzytelnienia Apple nie zostało obsłużone poprawnie.',
    appleInvalidResponse: 'Nieprawidłowa odpowiedź od Apple. Spróbuj ponownie.',
    appleInvalidScope: 'Żądano nieprawidłowego zakresu uwierzytelnienia.',
    appleUnexpectedError:
      'Wystąpił nieoczekiwany błąd podczas logowania Apple.',
    appleSignInCanceled: 'Logowanie Apple zostało anulowane przez użytkownika',
    signInError: 'Błąd logowania',
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
    // Maps integration translations
    openLocation: 'Otwórz Lokalizację',
    chooseMapApp: 'Wybierz aplikację do otwarcia lokalizacji:',
    failedToOpenMaps: 'Nie udało się otworzyć map. Spróbuj ponownie.',
    // Settings translations
    profile: 'Profil',
    notifications: 'Powiadomienia',
    language: 'Język',
    theme: 'Motyw',
    light: 'Jasny',
    dark: 'Ciemny',
    system: 'Systemowy',
    english: 'Angielski',
    polish: 'Polski',
    notificationsDescription:
      'Otrzymuj powiadomienia push o wydarzeniach i aktualizacjach',
    languageDescription: 'Wybierz preferowany język',
    themeDescription: 'Wybierz preferowany motyw',
    signInToAccessProfile: 'Zaloguj się, aby uzyskać dostęp do profilu',
    signInToAccessProfileDescription:
      'Zaloguj się, aby zapisać swoje preferencje i uzyskać dostęp do spersonalizowanych funkcji',
    // Social media translations
    connectWithUs: 'Skontaktuj się z nami',
    socialMediaDescription:
      'Obserwuj nas w mediach społecznościowych i skontaktuj się',
    cannotOpenLink: 'Nie można otworzyć tego linku',
    contactUsForSupport:
      'Potrzebujesz pomocy? Napisz do nas w mediach społecznościowych',
    // Team section translations
    team: 'Zespół',
    meetOurTeam: 'Poznaj nasz zespół',
    teamDescription: 'Dowiedz się o ludziach stojących za PWr Now',
    // First like modal translations
    firstLikeTitle: 'Fajnie! Polubiłeś wydarzenie!',
    firstLikeSubtitle: 'Oto co dostaniesz:',
    firstLikeBenefit1Title: 'Przypomnienia',
    firstLikeBenefit1Description: 'Powiadomienia przed wydarzeniami',
    firstLikeBenefit2Title: 'Aktualizacje',
    firstLikeBenefit2Description: 'Posty i info o polubionych wydarzeniach',
    firstLikeBenefit3Title: 'Pomóż organizatorom',
    firstLikeBenefit3Description: 'Pokaż które wydarzenia są interesujące',
    firstLikeContinue: 'Okej!',
  },
};

export const i18n = new I18n(translations);

// Always use system language
const deviceLanguageCode = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = deviceLanguageCode;
i18n.enableFallback = true;

export const t = (key: keyof TranslationMap, options?: Record<string, any>) =>
  i18n.t(key as string, options);

export const deviceLocaleTag: string =
  getLocales()[0]?.languageTag ??
  (deviceLanguageCode === 'pl' ? 'pl-PL' : 'en-US');

export default i18n;
