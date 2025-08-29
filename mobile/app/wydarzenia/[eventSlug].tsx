import { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Event } from '../../types';
import { useAnalytics } from '../../lib/analytics';
import { useEventBySlug } from '../../lib/queries';
import { Feather } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { config } from '../../lib/config';
import { t } from '../../lib/i18n';
import { useAuth } from '../../contexts/AuthContext';
import LikeButton from '../../components/LikeButton';
import SignInRequiredModal from '../../components/SignInRequiredModal';
import ImageView from 'react-native-image-viewing';
import { generateEventDays } from '../../components/WeekDaySelector';
import { useCalendar } from '../../hooks/useCalendar';
import EventHeroImage from '../../components/EventHeroImage';
import OrganizationHeader from '../../components/OrganizationHeader';
import EventMetaCard from '../../components/EventMetaCard';
import EventDescription from '../../components/EventDescription';
import VisitPageButton from '../../components/VisitPageButton';
import SegmentedTabs from '../../components/SegmentedTabs';
import EventTabsContent from '../../components/EventTabsContent';
import { formatPostTime, getInitials } from '../../lib/format';

type TabType = 'details' | 'posts' | 'schedule';

// Tab Content Components

// Dummy data for demonstration - posts from organization only
const getDummyPosts = (organizationName: string) => [
  {
    id: '1',
    author: organizationName,
    content:
      'Witamy wszystkich uczestników! Nie możemy się doczekać wspaniałego wydarzenia. Przygotowaliśmy dla Was wiele niespodzianek!',
    timestamp: '2024-03-15T10:30:00Z',
    images: [
      'https://picsum.photos/400/300?random=1',
      'https://picsum.photos/400/300?random=2',
    ],
  },
  {
    id: '2',
    author: organizationName,
    content:
      'Sprawdźcie nasz plan wydarzenia! Będzie dużo interesujących prezentacji i warsztatów.',
    timestamp: '2024-03-15T09:15:00Z',
    images: ['https://picsum.photos/400/300?random=3'],
  },
  {
    id: '3',
    author: organizationName,
    content: null, // Post with only images
    timestamp: '2024-03-14T16:45:00Z',
    images: [
      'https://picsum.photos/400/300?random=4',
      'https://picsum.photos/400/300?random=5',
      'https://picsum.photos/400/300?random=6',
    ],
  },
  {
    id: '4',
    author: organizationName,
    content:
      'Dziękujemy za rejestrację! Zobacz lokalizację wydarzenia na mapie.',
    timestamp: '2024-03-13T14:20:00Z',
    images: [],
  },
];

// Generate realistic multi-day schedule data based on current time for demo
const getMultiDayScheduleData = () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return {
    [yesterdayStr]: [
      {
        id: 'day1-1',
        time: '09:00',
        title: 'Rejestracja uczestników',
        description: 'Odbiór identyfikatorów i materiałów konferencyjnych',
        speaker: null,
        duration: '60 min',
        endTime: '10:00',
      },
      {
        id: 'day1-2',
        time: '10:00',
        title: 'Ceremonia otwarcia',
        description: 'Uroczyste otwarcie wydarzenia i powitanie uczestników',
        speaker: 'Prof. Jan Kowalski',
        duration: '30 min',
        endTime: '10:30',
      },
      {
        id: 'day1-3',
        time: '10:30',
        title: 'Keynote: Digitalna transformacja',
        description: 'Jak technologia zmienia nasze życie zawodowe i prywatne',
        speaker: 'Dr Anna Nowak',
        duration: '45 min',
        endTime: '11:15',
      },
      {
        id: 'day1-4',
        time: '11:15',
        title: 'Przerwa kawowa',
        description: 'Networking i refreshment w holu głównym',
        speaker: null,
        duration: '15 min',
        endTime: '11:30',
      },
      {
        id: 'day1-5',
        time: '11:30',
        title: 'Panel: Przyszłość pracy',
        description: 'Dyskusja o remote work i nowych formach zatrudnienia',
        speaker: 'Panel ekspertów HR',
        duration: '60 min',
        endTime: '12:30',
      },
      {
        id: 'day1-6',
        time: '12:30',
        title: 'Lunch break',
        description: 'Wspólny obiad i networking',
        speaker: null,
        duration: '90 min',
        endTime: '14:00',
      },
      {
        id: 'day1-7',
        time: '14:00',
        title: 'Warsztaty: Design Thinking',
        description: 'Praktyczne zastosowanie metodyki design thinking',
        speaker: 'Maria Kowalczyk',
        duration: '120 min',
        endTime: '16:00',
      },
      {
        id: 'day1-8',
        time: '16:00',
        title: 'Networking session',
        description: 'Nieformalne rozmowy i wymiana kontaktów',
        speaker: null,
        duration: '60 min',
        endTime: '17:00',
      },
    ],
    [today]: [
      {
        id: 'day2-1',
        time: '09:00',
        title: 'Poranjna kawa',
        description: 'Rozpoczęcie drugiego dnia z kawą i croissantami',
        speaker: null,
        duration: '30 min',
        endTime: '09:30',
      },
      {
        id: 'day2-2',
        time: '09:30',
        title: 'Keynote: AI w biznesie',
        description: 'Praktyczne zastosowania sztucznej inteligencji',
        speaker: 'Dr Piotr Wiśniewski',
        duration: '45 min',
        endTime: '10:15',
      },
      {
        id: 'day2-3',
        time: '10:15',
        title: 'Przerwa',
        description: 'Krótka przerwa na rozciągnięcie',
        speaker: null,
        duration: '15 min',
        endTime: '10:30',
      },
      {
        id: 'day2-4',
        time: '10:30',
        title: 'Warsztaty: Machine Learning',
        description: 'Wprowadzenie do algorytmów uczenia maszynowego',
        speaker: 'Zespół Data Science',
        duration: '90 min',
        endTime: '12:00',
      },
      {
        id: 'day2-5',
        time: '12:00',
        title: 'Panel: Startup ecosystem',
        description: 'Dyskusja o ekosystemie startupowym w Polsce',
        speaker: 'Założyciele startupów',
        duration: '60 min',
        endTime: '13:00',
      },
      {
        id: 'day2-6',
        time: '13:00',
        title: 'Lunch break',
        description: 'Wspólny posiłek w restauracji hotelowej',
        speaker: null,
        duration: '60 min',
        endTime: '14:00',
      },
      {
        id: 'day2-7',
        time: '14:00',
        title: 'Tech talk: DevOps',
        description: 'Automatyzacja procesów i best practices',
        speaker: 'Michał Kowalski',
        duration: '45 min',
        endTime: '14:45',
      },
      {
        id: 'day2-8',
        time: '14:45',
        title: 'Q&A Session',
        description: 'Pytania i odpowiedzi z wszystkimi prelegentami',
        speaker: 'Wszyscy prelegenci',
        duration: '30 min',
        endTime: '15:15',
      },
      {
        id: 'day2-9',
        time: '15:15',
        title: 'Ceremonia zamknięcia',
        description: 'Podsumowanie wydarzenia i plany na przyszłość',
        speaker: 'Organizatorzy',
        duration: '30 min',
        endTime: '15:45',
      },
    ],
    [tomorrowStr]: [
      {
        id: 'day3-1',
        time: '09:00',
        title: 'Śniadanie networkingowe',
        description: 'Rozpoczęcie ostatniego dnia z networking breakfast',
        speaker: null,
        duration: '60 min',
        endTime: '10:00',
      },
      {
        id: 'day3-2',
        time: '10:00',
        title: 'Keynote: Zrównoważony rozwój',
        description: 'Technologia w służbie zrównoważonego rozwoju',
        speaker: 'Prof. Barbara Zielińska',
        duration: '45 min',
        endTime: '10:45',
      },
      {
        id: 'day3-3',
        time: '10:45',
        title: 'Przerwa kawowa',
        description: 'Ostatnia przerwa kawowa wydarzenia',
        speaker: null,
        duration: '15 min',
        endTime: '11:00',
      },
      {
        id: 'day3-4',
        time: '11:00',
        title: 'Warsztaty: Liderstwo',
        description: 'Rozwój umiejętności przywódczych w zespole',
        speaker: 'Katarzyna Nowak',
        duration: '90 min',
        endTime: '12:30',
      },
      {
        id: 'day3-5',
        time: '12:30',
        title: 'Panel podsumowujący',
        description: 'Podsumowanie trzech dni konferencji',
        speaker: 'Główni prelegenci',
        duration: '60 min',
        endTime: '13:30',
      },
      {
        id: 'day3-6',
        time: '13:30',
        title: 'Lunch pożegnalny',
        description: 'Ostatni wspólny posiłek i pożegnania',
        speaker: null,
        duration: '90 min',
        endTime: '15:00',
      },
      {
        id: 'day3-7',
        time: '15:00',
        title: 'Zakończenie wydarzenia',
        description: 'Oficjalne zakończenie i dziękczynienie',
        speaker: 'Dyrektor konferencji',
        duration: '15 min',
        endTime: '15:15',
      },
    ],
  };
};

export default function EventDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconPrimary = isDark ? '#FFFFFF' : '#000000';
  const { eventSlug } = useLocalSearchParams();
  const router = useRouter();
  const analytics = useAnalytics();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  // Description is always fully shown in redesigned details tab
  const [isLiked, setIsLiked] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const { isAuthenticated } = useAuth();
  const scheduleScrollRef = useRef<any>(null);
  const mainScrollRef = useRef<ScrollView>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<{ uri: string }[]>(
    []
  );
  const [imageViewerInitialIndex, setImageViewerInitialIndex] = useState(0);

  // Animation values
  const ctaScale = useSharedValue(1);
  // CTA animations

  const {
    data: event,
    isLoading,
    error,
  } = useEventBySlug(typeof eventSlug === 'string' ? eventSlug : undefined);

  // Calendar hook
  const { handleAddToCalendar } = event
    ? useCalendar({ event })
    : { handleAddToCalendar: undefined };

  // Generate days from event dates and initialize selected day
  const eventDays = event
    ? generateEventDays(event.starts_at, event.ends_at)
    : [];

  // Generate schedule data based on actual event days
  const dummyScheduleByDay =
    event && eventDays.length > 0
      ? (() => {
          const scheduleData: Record<string, any[]> = {};

          eventDays.forEach((day, index) => {
            if (index === 0) {
              // First day
              scheduleData[day.id] = [
                {
                  id: 'day1-1',
                  time: '09:00',
                  title: 'Rejestracja uczestników',
                  description:
                    'Odbiór identyfikatorów i materiałów konferencyjnych',
                  speaker: null,
                  duration: '60 min',
                  endTime: '10:00',
                },
                {
                  id: 'day1-2',
                  time: '10:00',
                  title: 'Ceremonia otwarcia',
                  description:
                    'Uroczyste otwarcie wydarzenia i powitanie uczestników',
                  speaker: 'Prof. Jan Kowalski',
                  duration: '30 min',
                  endTime: '10:30',
                },
                {
                  id: 'day1-3',
                  time: '10:30',
                  title: 'Keynote: Digitalna transformacja',
                  description:
                    'Jak technologia zmienia nasze życie zawodowe i prywatne',
                  speaker: 'Dr Anna Nowak',
                  duration: '45 min',
                  endTime: '11:15',
                },
                {
                  id: 'day1-4',
                  time: '11:15',
                  title: 'Przerwa kawowa',
                  description: 'Networking i refreshment w holu głównym',
                  speaker: null,
                  duration: '15 min',
                  endTime: '11:30',
                },
                {
                  id: 'day1-5',
                  time: '11:30',
                  title: 'Panel: Przyszłość pracy',
                  description:
                    'Dyskusja o remote work i nowych formach zatrudnienia',
                  speaker: 'Panel ekspertów HR',
                  duration: '60 min',
                  endTime: '12:30',
                },
                {
                  id: 'day1-6',
                  time: '12:30',
                  title: 'Lunch break',
                  description: 'Wspólny obiad i networking',
                  speaker: null,
                  duration: '90 min',
                  endTime: '14:00',
                },
                {
                  id: 'day1-7',
                  time: '14:00',
                  title: 'Warsztaty: Design Thinking',
                  description:
                    'Praktyczne zastosowanie metodyki design thinking',
                  speaker: 'Maria Kowalczyk',
                  duration: '120 min',
                  endTime: '16:00',
                },
                {
                  id: 'day1-8',
                  time: '16:00',
                  title: 'Networking session',
                  description: 'Nieformalne rozmowy i wymiana kontaktów',
                  speaker: null,
                  duration: '60 min',
                  endTime: '17:00',
                },
              ];
            } else if (index === 1) {
              // Second day
              scheduleData[day.id] = [
                {
                  id: 'day2-1',
                  time: '09:00',
                  title: 'Porannja kawa',
                  description:
                    'Rozpoczęcie drugiego dnia z kawą i croissantami',
                  speaker: null,
                  duration: '30 min',
                  endTime: '09:30',
                },
                {
                  id: 'day2-2',
                  time: '09:30',
                  title: 'Keynote: AI w biznesie',
                  description: 'Praktyczne zastosowania sztucznej inteligencji',
                  speaker: 'Dr Piotr Wiśniewski',
                  duration: '45 min',
                  endTime: '10:15',
                },
                {
                  id: 'day2-3',
                  time: '10:15',
                  title: 'Przerwa',
                  description: 'Krótka przerwa na rozciągnięcie',
                  speaker: null,
                  duration: '15 min',
                  endTime: '10:30',
                },
                {
                  id: 'day2-4',
                  time: '10:30',
                  title: 'Warsztaty: Machine Learning',
                  description: 'Wprowadzenie do algorytmów uczenia maszynowego',
                  speaker: 'Zespół Data Science',
                  duration: '90 min',
                  endTime: '12:00',
                },
                {
                  id: 'day2-5',
                  time: '12:00',
                  title: 'Panel: Startup ecosystem',
                  description: 'Dyskusja o ekosystemie startupowym w Polsce',
                  speaker: 'Założyciele startupów',
                  duration: '60 min',
                  endTime: '13:00',
                },
                {
                  id: 'day2-6',
                  time: '13:00',
                  title: 'Lunch break',
                  description: 'Wspólny posiłek w restauracji hotelowej',
                  speaker: null,
                  duration: '60 min',
                  endTime: '14:00',
                },
                {
                  id: 'day2-7',
                  time: '14:00',
                  title: 'Tech talk: DevOps',
                  description: 'Automatyzacja procesów i best practices',
                  speaker: 'Michał Kowalski',
                  duration: '45 min',
                  endTime: '14:45',
                },
                {
                  id: 'day2-8',
                  time: '14:45',
                  title: 'Q&A Session',
                  description: 'Pytania i odpowiedzi z wszystkimi prelegentami',
                  speaker: 'Wszyscy prelegenci',
                  duration: '30 min',
                  endTime: '15:15',
                },
                {
                  id: 'day2-9',
                  time: '15:15',
                  title: 'Ceremonia zamknięcia',
                  description: 'Podsumowanie wydarzenia i plany na przyszłość',
                  speaker: 'Organizatorzy',
                  duration: '30 min',
                  endTime: '15:45',
                },
              ];
            } else {
              // Third day and beyond
              scheduleData[day.id] = [
                {
                  id: `day${index + 1}-1`,
                  time: '09:00',
                  title: 'Śniadanie networkingowe',
                  description:
                    'Rozpoczęcie ostatniego dnia z networking breakfast',
                  speaker: null,
                  duration: '60 min',
                  endTime: '10:00',
                },
                {
                  id: `day${index + 1}-2`,
                  time: '10:00',
                  title: 'Keynote: Zrównoważony rozwój',
                  description: 'Technologia w służbie zrównoważonego rozwoju',
                  speaker: 'Prof. Barbara Zielińska',
                  duration: '45 min',
                  endTime: '10:45',
                },
                {
                  id: `day${index + 1}-3`,
                  time: '10:45',
                  title: 'Przerwa kawowa',
                  description: 'Ostatnia przerwa kawowa wydarzenia',
                  speaker: null,
                  duration: '15 min',
                  endTime: '11:00',
                },
                {
                  id: `day${index + 1}-4`,
                  time: '11:00',
                  title: 'Warsztaty: Liderstwo',
                  description: 'Rozwój umiejętności przywódczych w zespole',
                  speaker: 'Katarzyna Nowak',
                  duration: '90 min',
                  endTime: '12:30',
                },
                {
                  id: `day${index + 1}-5`,
                  time: '12:30',
                  title: 'Panel podsumowujący',
                  description: 'Podsumowanie trzech dni konferencji',
                  speaker: 'Główni prelegenci',
                  duration: '60 min',
                  endTime: '13:30',
                },
                {
                  id: `day${index + 1}-6`,
                  time: '13:30',
                  title: 'Lunch pożegnalny',
                  description: 'Ostatni wspólny posiłek i pożegnania',
                  speaker: null,
                  duration: '90 min',
                  endTime: '15:00',
                },
                {
                  id: `day${index + 1}-7`,
                  time: '15:00',
                  title: 'Zakończenie wydarzenia',
                  description: 'Oficjalne zakończenie i dziękczynienie',
                  speaker: 'Dyrektor konferencji',
                  duration: '15 min',
                  endTime: '15:15',
                },
              ];
            }
          });

          return scheduleData;
        })()
      : {};

  useEffect(() => {
    if (eventDays.length > 0 && !selectedDay) {
      // Try to select today if it's within the event dates, otherwise select the first day
      const todayOption = eventDays.find((day) => day.isToday);
      setSelectedDay(todayOption ? todayOption.id : eventDays[0].id);
    }
  }, [eventDays, selectedDay]);

  // Helper functions for schedule timing
  const isEventPast = (eventDate: string, time: string, endTime: string) => {
    const now = new Date();
    const eventDateTime = new Date(`${eventDate}T${endTime}:00`);
    return eventDateTime < now;
  };

  const isEventCurrent = (eventDate: string, time: string, endTime: string) => {
    const now = new Date();
    const startDateTime = new Date(`${eventDate}T${time}:00`);
    const endDateTime = new Date(`${eventDate}T${endTime}:00`);
    return now >= startDateTime && now <= endDateTime;
  };

  const findCurrentEventIndex = (scheduleItems: any[]) => {
    const currentIndex = scheduleItems.findIndex((item) =>
      isEventCurrent(selectedDay, item.time, item.endTime)
    );
    if (currentIndex !== -1) return currentIndex;

    // If no current event, find the next upcoming event
    const upcomingIndex = scheduleItems.findIndex(
      (item) => !isEventPast(selectedDay, item.time, item.endTime)
    );
    return upcomingIndex !== -1 ? upcomingIndex : 0;
  };

  // Auto-scroll to current event when tab becomes active or day changes
  useEffect(() => {
    if (activeTab === 'schedule' && selectedDay && scheduleScrollRef.current) {
      const scheduleItems =
        dummyScheduleByDay[selectedDay as keyof typeof dummyScheduleByDay] ||
        [];
      if (scheduleItems.length > 0) {
        const currentEventIndex = findCurrentEventIndex(scheduleItems);

        // Scroll to current event with a slight delay to ensure layout is complete
        setTimeout(() => {
          scheduleScrollRef.current?.scrollTo({
            y: currentEventIndex * 120, // Approximate height of each schedule item
            animated: true,
          });
        }, 300);
      }
    }
  }, [activeTab, selectedDay]);

  // Scroll to top when tab changes
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({
        y: 0,
        animated: true,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (event) {
      analytics.trackEventDetailViewed(event as any, 'navigation');
    }
  }, [event]);

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  // Ensure a back target exists when opening this screen from a universal link
  // by injecting the home route before the event route on first mount.
  useEffect(() => {
    if (!router.canGoBack() && typeof eventSlug === 'string') {
      const eventPath = `/wydarzenia/${eventSlug}`;
      // Replace current (deep-linked) route with home, then push the event.
      // Using timeouts to sequence navigation and avoid race conditions.
      setTimeout(() => {
        router.replace('/');
        setTimeout(() => {
          router.push(eventPath as any);
        }, 0);
      }, 0);
    }
    // We intentionally run only on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert(t('errorTitle'), t('failedToLoadEvent'), [
        { text: t('ok'), onPress: () => router.replace('/') },
      ]);
    }
  }, [error]);

  // formatting moved to lib/format

  // No description expand/collapse in redesigned details tab

  const handleHeartPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    analytics.trackEventFavoriteToggled(event as any, nextLiked);
  };

  const handleImagePress = async (images: string[], initialIndex: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const formattedImages = images.map((uri) => ({ uri }));
    setImageViewerImages(formattedImages);
    setImageViewerInitialIndex(initialIndex);
    setImageViewerVisible(true);
  };

  // No Add to Calendar in redesigned details tab

  const handleMapPress = async () => {
    if (!event) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = `https://maps.apple.com/?q=${encodeURIComponent(
      event.location || ''
    )}`;
    await Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-white dark:bg-black'>
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator
            size='large'
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView className='flex-1 bg-white dark:bg-black'>
        <View className='flex-1 justify-center items-center px-6'>
          <Feather
            name='alert-circle'
            size={64}
            color={isDark ? '#6B7280' : '#9CA3AF'}
          />
          <Text className='text-black dark:text-white text-center text-xl font-semibold mb-2 mt-4'>
            {t('failedToLoadEvent')}
          </Text>
          <Text className='text-black/60 dark:text-white/60 text-center mb-6'>
            {t('tryAgainLater')}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/')}
            className='bg-accentBlue px-6 py-3 rounded-xl'
          >
            <Text className='text-white font-semibold'>{t('backToHome')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Share functionality removed

  const handleExternalLink = async () => {
    try {
      ctaScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (event.url) {
        await Linking.openURL(event.url);
      }
      ctaScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    } catch (error) {
      ctaScale.value = withSpring(1, { damping: 12, stiffness: 200 });
      console.error('Error opening external link:', error);
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-white dark:bg-black'>
      <SignInRequiredModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignIn={() => {
          setShowAuthModal(false);
          router.push('/signin' as any);
        }}
      />
      <ImageView
        images={imageViewerImages}
        imageIndex={imageViewerInitialIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
      {/* Custom Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        className='flex-row items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10'
      >
        <TouchableOpacity onPress={() => router.back()} className='p-2 -ml-2'>
          <Feather name='arrow-left' size={24} color={iconPrimary} />
        </TouchableOpacity>
        <Text
          className='flex-1 text-center text-lg font-groteskSemibold text-black dark:text-white mx-4'
          numberOfLines={1}
        >
          {event.title}
        </Text>
        <View className='flex-row items-center'>
          <LikeButton
            isLiked={isLiked}
            onPress={handleHeartPress}
            size={20}
            className='mr-2'
          />
        </View>
      </Animated.View>

      {/* Segmented Tabs */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <SegmentedTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </Animated.View>

      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        className='flex-1'
      >
        {/* Tab Content */}
        <View className='flex-1 pb-8'>
          {activeTab === 'details' && (
            <Animated.View
              key='details'
              entering={FadeInDown.duration(300)}
              className='space-y-4'
            >
              {/* Event Image */}
              {event.image_url && (
                <Animated.View entering={FadeInDown.duration(400).delay(100)}>
                  <EventHeroImage imageUrl={event.image_url} />
                </Animated.View>
              )}

              {/* Organization Header */}
              <Animated.View entering={FadeInDown.duration(400).delay(150)}>
                <OrganizationHeader
                  organization={event.organization}
                  categoryName={event.category.name}
                />
              </Animated.View>

              {/* Event Details Section */}
              <EventMetaCard
                startsAt={event.starts_at}
                endsAt={event.ends_at}
                location={event.location}
                onCalendarPress={handleAddToCalendar}
                onMapPress={handleMapPress}
              />

              {/* Event Description */}
              <EventDescription description={event.description} />

              {/* Visit Page Button - Old EventCard Design */}
              {event.url && (
                <VisitPageButton
                  onPress={handleExternalLink}
                  animatedStyle={ctaAnimatedStyle}
                />
              )}
            </Animated.View>
          )}

          <EventTabsContent
            activeTab={activeTab}
            postsProps={{
              event,
              isDark,
              iconPrimary,
              dummyPosts: getDummyPosts(event.organization.name),
              formatPostTime,
              getInitials,
              organizationImageUrl: event.organization.image_url || undefined,
              onImagePress: handleImagePress,
            }}
            scheduleProps={{
              selectedDay,
              setSelectedDay,
              eventDays,
              itemsByDay: dummyScheduleByDay,
              isDark,
              scheduleScrollRef,
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
