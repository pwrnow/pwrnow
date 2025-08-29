import { useEffect, useState, useCallback, useRef } from 'react';
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
  Image,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Event } from '../../types';
import { useAnalytics } from '../../lib/analytics';
import { useEventBySlug } from '../../lib/queries';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import * as Calendar from 'expo-calendar';
import { config } from '../../lib/config';
import { t } from '../../lib/i18n';
import { deviceLocaleTag } from '../../lib/i18n';
import { useAuth } from '../../contexts/AuthContext';
import LikeButton from '../../components/LikeButton';
import WeekDaySelector, {
  generateEventDays,
} from '../../components/WeekDaySelector';

const { width: screenWidth } = Dimensions.get('window');

type TabType = 'details' | 'posts' | 'schedule';

// Tab Content Components
interface TabContentProps {
  isActive: boolean;
  event: Event;
  isDark: boolean;
  iconPrimary: string;
}

const PostsTabContent: React.FC<
  TabContentProps & {
    dummyPosts: any[];
    formatPostTime: (timestamp: string) => string;
    getInitials: (name: string) => string;
    organizationImageUrl?: string;
  }
> = ({
  isActive,
  dummyPosts,
  formatPostTime,
  getInitials,
  organizationImageUrl,
}) => {
  if (!isActive) return null;

  const renderImages = (images: string[]) => {
    if (!images || images.length === 0) return null;

    if (images.length === 1) {
      return (
        <View className='mt-3 rounded-lg overflow-hidden'>
          <Image
            source={{ uri: images[0] }}
            className='w-full rounded-lg'
            style={{ height: 200 }}
            resizeMode='cover'
          />
        </View>
      );
    }

    if (images.length === 2) {
      return (
        <View className='mt-3 flex-row gap-2'>
          {images.map((image, index) => (
            <View key={index} className='flex-1 rounded-lg overflow-hidden'>
              <Image
                source={{ uri: image }}
                className='w-full rounded-lg'
                style={{ height: 150 }}
                resizeMode='cover'
              />
            </View>
          ))}
        </View>
      );
    }

    // For 3+ images, show first 2 full size and remaining in a grid
    if (images.length >= 3) {
      return (
        <View className='mt-3 gap-2'>
          <View className='flex-row gap-2'>
            <View className='flex-1 rounded-lg overflow-hidden'>
              <Image
                source={{ uri: images[0] }}
                className='w-full rounded-lg'
                style={{ height: 150 }}
                resizeMode='cover'
              />
            </View>
            <View className='flex-1 rounded-lg overflow-hidden'>
              <Image
                source={{ uri: images[1] }}
                className='w-full rounded-lg'
                style={{ height: 150 }}
                resizeMode='cover'
              />
            </View>
          </View>
          <View className='flex-row gap-2'>
            <View className='flex-1 rounded-lg overflow-hidden'>
              <Image
                source={{ uri: images[2] }}
                className='w-full rounded-lg'
                style={{ height: 100 }}
                resizeMode='cover'
              />
            </View>
            {images.length > 3 && (
              <View className='flex-1 rounded-lg overflow-hidden relative'>
                <Image
                  source={{ uri: images[3] }}
                  className='w-full rounded-lg'
                  style={{ height: 100 }}
                  resizeMode='cover'
                />
                {images.length > 4 && (
                  <View className='absolute inset-0 bg-black/50 rounded-lg items-center justify-center'>
                    <Text className='text-white font-groteskSemibold text-sm'>
                      +{images.length - 4}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      );
    }
  };

  return (
    <Animated.View
      key='posts'
      entering={FadeInDown.duration(300)}
      exiting={FadeInDown.duration(150)}
      className='space-y-3'
    >
      {dummyPosts.map((post, index) => (
        <Animated.View
          key={post.id}
          entering={FadeInDown.duration(200).delay(index * 50)}
          className='bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4'
        >
          {/* Organization Header */}
          <View className='flex-row items-center mb-3'>
            <View className='w-8 h-8 rounded-full overflow-hidden bg-accentBlue/20 items-center justify-center mr-3'>
              {organizationImageUrl ? (
                <Image
                  source={{ uri: organizationImageUrl }}
                  className='w-full h-full'
                  resizeMode='cover'
                />
              ) : (
                <Text className='text-accentBlue font-groteskSemibold text-xs'>
                  {getInitials(post.author)}
                </Text>
              )}
            </View>
            <View className='flex-1'>
              <Text className='text-black dark:text-white font-groteskMedium text-sm'>
                {post.author}
              </Text>
              <Text className='text-black/50 dark:text-white/50 font-grotesk text-xs'>
                {formatPostTime(post.timestamp)}
              </Text>
            </View>
          </View>

          {/* Post Content */}
          {post.content && (
            <Text className='text-black/90 dark:text-white/90 font-grotesk text-sm leading-5'>
              {post.content}
            </Text>
          )}

          {/* Post Images */}
          {renderImages(post.images)}
        </Animated.View>
      ))}
    </Animated.View>
  );
};

const ScheduleTabContent: React.FC<
  TabContentProps & { dummySchedule: any[]; iconPrimary: string }
> = ({ isActive, iconPrimary, dummySchedule }) => {
  if (!isActive) return null;

  return (
    <Animated.View
      key='schedule'
      entering={FadeInDown.duration(300)}
      exiting={FadeInDown.duration(150)}
      className='space-y-2'
    >
      {dummySchedule.map((item, index) => (
        <Animated.View
          key={item.id}
          entering={FadeInDown.duration(200).delay(index * 40)}
          className='bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-3'
        >
          <View className='flex-row'>
            <View className='w-14 mr-3'>
              <View className='bg-accentBlue/15 border border-accentBlue/30 rounded-lg px-2 py-1'>
                <Text className='text-accentBlue font-groteskSemibold text-xs text-center'>
                  {item.time}
                </Text>
              </View>
              <Text className='text-black/40 dark:text-white/40 font-grotesk text-xs text-center mt-1'>
                {item.duration}
              </Text>
            </View>

            <View className='flex-1'>
              <Text className='text-black dark:text-white font-groteskSemibold text-sm mb-1'>
                {item.title}
              </Text>
              <Text className='text-black/70 dark:text-white/70 font-grotesk text-xs leading-4 mb-1'>
                {item.description}
              </Text>
              {item.speaker && (
                <View className='flex-row items-center'>
                  <Feather name='user' size={10} color={iconPrimary} />
                  <Text className='text-black/60 dark:text-white/60 font-groteskMedium text-xs ml-1'>
                    {item.speaker}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      ))}

      <View className='bg-accentPink/10 border border-accentPink/30 rounded-xl p-3 mt-3'>
        <View className='flex-row items-center mb-1'>
          <Feather name='info' size={14} color='#EC2E81' />
          <Text className='text-accentPink font-groteskSemibold text-sm ml-1.5'>
            {t('scheduleNote')}
          </Text>
        </View>
        <Text className='text-accentPink/80 font-grotesk text-xs'>
          {t('scheduleNoteDescription')}
        </Text>
      </View>
    </Animated.View>
  );
};

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

// Generate realistic schedule data based on current time for demo
const getCurrentTimeBasedSchedule = () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  return {
    [today]: [
      {
        id: '1',
        time: '08:00',
        title: 'Rejestracja uczestników',
        description: 'Odbiór identyfikatorów i materiałów konferencyjnych',
        speaker: null,
        duration: '60 min',
        endTime: '09:00',
      },
      {
        id: '2',
        time: '09:00',
        title: 'Ceremonia otwarcia',
        description: 'Powitanie uczestników i wprowadzenie do wydarzenia',
        speaker: 'Maria Kowalska',
        duration: '30 min',
        endTime: '09:30',
      },
      {
        id: '3',
        time: '09:30',
        title: 'Keynote: Przyszłość technologii',
        description: 'Najnowsze trendy w AI i machine learning',
        speaker: 'Dr Piotr Nowak',
        duration: '45 min',
        endTime: '10:15',
      },
      {
        id: '4',
        time: '10:15',
        title: 'Przerwa kawowa',
        description: 'Networking i refreshment',
        speaker: null,
        duration: '15 min',
        endTime: '10:30',
      },
      {
        id: '5',
        time: '10:30',
        title: 'Panel: Startup ecosystem',
        description: 'Dyskusja o ekosystemie startupowym w Polsce',
        speaker: 'Panel ekspertów',
        duration: '60 min',
        endTime: '11:30',
      },
      {
        id: '6',
        time: '11:30',
        title: 'Warsztaty: Product Management',
        description: 'Praktyczne podejście do zarządzania produktem',
        speaker: 'Anna Kowalska',
        duration: '90 min',
        endTime: '13:00',
      },
      {
        id: '7',
        time: '13:00',
        title: 'Lunch break',
        description: 'Wspólny posiłek i networking',
        speaker: null,
        duration: '60 min',
        endTime: '14:00',
      },
      {
        id: '8',
        time: '14:00',
        title: 'Tech talk: DevOps w praktyce',
        description: 'Automatyzacja procesów i best practices',
        speaker: 'Michał Wiśniewski',
        duration: '45 min',
        endTime: '14:45',
      },
      {
        id: '9',
        time: '14:45',
        title: 'Q&A Session',
        description: 'Pytania i odpowiedzi z prelegentami',
        speaker: 'Wszyscy prelegenci',
        duration: '30 min',
        endTime: '15:15',
      },
      {
        id: '10',
        time: '15:15',
        title: 'Ceremonia zamknięcia',
        description: 'Podsumowanie i plany na przyszłość',
        speaker: 'Organizatorzy',
        duration: '15 min',
        endTime: '15:30',
      },
    ],
  };
};

const dummyScheduleByDay = getCurrentTimeBasedSchedule();

export default function EventDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconPrimary = isDark ? '#FFFFFF' : '#000000';
  const { eventSlug } = useLocalSearchParams();
  const router = useRouter();
  const analytics = useAnalytics();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const { isAuthenticated } = useAuth();
  const scheduleScrollRef = useRef<any>(null);

  // Animation values
  const shareScale = useSharedValue(1);
  const ctaScale = useSharedValue(1);
  const gradientOpacity = useSharedValue(1);

  const {
    data: event,
    isLoading,
    error,
  } = useEventBySlug(typeof eventSlug === 'string' ? eventSlug : undefined);

  // Generate days from event dates and initialize selected day
  const eventDays = event
    ? generateEventDays(event.starts_at, event.ends_at)
    : [];

  useEffect(() => {
    if (eventDays.length > 0 && !selectedDay) {
      setSelectedDay(eventDays[0].id);
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

  useEffect(() => {
    if (event) {
      analytics.trackEventDetailViewed(event as any, 'navigation');
    }
  }, [event]);

  useEffect(() => {
    gradientOpacity.value = withTiming(isDescriptionExpanded ? 0 : 1, {
      duration: 200,
    });
  }, [isDescriptionExpanded]);

  const animatedGradientStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));

  const shareAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareScale.value }],
  }));

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = deviceLocaleTag;
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const locale = deviceLocaleTag;
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateRangeShort = (startString: string, endString: string) => {
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

  const formatTimeRangeShort = (startString: string, endString: string) => {
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPostTime = (timestamp: string) => {
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

  const handleDescriptionToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const handleHeartPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isAuthenticated) {
      Alert.alert(t('signInRequiredTitle'), t('signInRequiredMessage'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('signIn'), onPress: () => router.push('/signin' as any) },
      ]);
      return;
    }
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    analytics.trackEventFavoriteToggled(event as any, nextLiked);
  };

  const handleAddToCalendar = async () => {
    if (!event) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Check/request permissions
      let { status } = await Calendar.getCalendarPermissionsAsync();
      if (status !== 'granted') {
        const req = await Calendar.requestCalendarPermissionsAsync();
        status = req.status;
        if (status !== 'granted') {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          Alert.alert(
            t('permissionDeniedTitle'),
            t('permissionDeniedMessage'),
            [
              { text: t('cancel'), style: 'cancel' },
              { text: t('settings'), onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
      }

      const startsAt = new Date(event.starts_at);
      const endsAt = new Date(event.ends_at);

      const result = await Calendar.createEventInCalendarAsync({
        title: event.title,
        startDate: startsAt,
        endDate: endsAt,
        location: event.location ?? '',
        notes: event.description ?? '',
        url: event.url || `${config.shareBaseUrl}/${event.slug}`,
      });

      if (result?.action === Calendar.CalendarDialogResultActions.saved) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        Alert.alert(
          t('successTitle'),
          t('eventAddedToCalendar', { title: event.title })
        );
      } else if (
        result?.action === Calendar.CalendarDialogResultActions.canceled
      ) {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('errorTitle'), t('calendarOpenFailed'));
    }
  };

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

  const handleShare = async () => {
    try {
      shareScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const shareUrl = `${config.shareBaseUrl}/${event.slug}`;
      const shareText = `${event.title}\n\n${event.description || ''}\n\n${t(
        'moreInfo'
      )}: ${shareUrl}`;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUrl, {
          mimeType: 'text/plain',
          dialogTitle: t('shareEvent'),
        });
      } else {
        Alert.alert(t('share'), shareText);
      }

      shareScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    } catch (error) {
      shareScale.value = withSpring(1, { damping: 12, stiffness: 200 });
      console.error('Error sharing event:', error);
    }
  };

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

      {/* Simple Tab Navigation - Moved to Top */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(200)}
        className='px-4 pt-4 pb-2 border-b border-black/10 dark:border-white/10'
      >
        <View className='bg-black/5 dark:bg-white/5 rounded-xl p-1 border border-black/10 dark:border-white/10'>
          <View className='flex-row'>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('details');
              }}
              className={`flex-1 py-3 px-4 rounded-lg items-center ${
                activeTab === 'details'
                  ? 'bg-white dark:bg-black border border-black/10 dark:border-white/20'
                  : 'bg-transparent'
              }`}
              style={
                activeTab === 'details' && !isDark
                  ? {
                      shadowColor: '#000',
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 1 },
                      elevation: 2,
                    }
                  : undefined
              }
              activeOpacity={0.7}
            >
              <View className='flex-row items-center'>
                <Feather
                  name='info'
                  size={16}
                  color={
                    activeTab === 'details'
                      ? isDark
                        ? '#FFFFFF'
                        : '#000000'
                      : isDark
                      ? '#FFFFFF80'
                      : '#00000080'
                  }
                />
                <Text
                  className={`ml-2 font-groteskMedium text-sm ${
                    activeTab === 'details'
                      ? 'text-black dark:text-white'
                      : 'text-black/50 dark:text-white/50'
                  }`}
                >
                  {t('details')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('posts');
              }}
              className={`flex-1 py-3 px-4 rounded-lg items-center ${
                activeTab === 'posts'
                  ? 'bg-white dark:bg-black border border-black/10 dark:border-white/20'
                  : 'bg-transparent'
              }`}
              style={
                activeTab === 'posts' && !isDark
                  ? {
                      shadowColor: '#000',
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 1 },
                      elevation: 2,
                    }
                  : undefined
              }
              activeOpacity={0.7}
            >
              <View className='flex-row items-center'>
                <Feather
                  name='message-circle'
                  size={16}
                  color={
                    activeTab === 'posts'
                      ? isDark
                        ? '#FFFFFF'
                        : '#000000'
                      : isDark
                      ? '#FFFFFF80'
                      : '#00000080'
                  }
                />
                <Text
                  className={`ml-2 font-groteskMedium text-sm ${
                    activeTab === 'posts'
                      ? 'text-black dark:text-white'
                      : 'text-black/50 dark:text-white/50'
                  }`}
                >
                  {t('posts')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('schedule');
              }}
              className={`flex-1 py-3 px-4 rounded-lg items-center ${
                activeTab === 'schedule'
                  ? 'bg-white dark:bg-black border border-black/10 dark:border-white/20'
                  : 'bg-transparent'
              }`}
              style={
                activeTab === 'schedule' && !isDark
                  ? {
                      shadowColor: '#000',
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 1 },
                      elevation: 2,
                    }
                  : undefined
              }
              activeOpacity={0.7}
            >
              <View className='flex-row items-center'>
                <Feather
                  name='calendar'
                  size={16}
                  color={
                    activeTab === 'schedule'
                      ? isDark
                        ? '#FFFFFF'
                        : '#000000'
                      : isDark
                      ? '#FFFFFF80'
                      : '#00000080'
                  }
                />
                <Text
                  className={`ml-2 font-groteskMedium text-sm ${
                    activeTab === 'schedule'
                      ? 'text-black dark:text-white'
                      : 'text-black/50 dark:text-white/50'
                  }`}
                >
                  {t('schedule')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} className='flex-1'>
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
                  <View className='relative mx-4'>
                    <Image
                      source={{ uri: event.image_url }}
                      className='w-full rounded-xl'
                      style={{ height: screenWidth * 0.5 }}
                      resizeMode='cover'
                    />
                    {/* Gradient overlay */}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.6)']}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 100,
                        borderBottomLeftRadius: 12,
                        borderBottomRightRadius: 12,
                      }}
                    />
                  </View>
                </Animated.View>
              )}

              {/* Organization Header */}
              <Animated.View
                entering={FadeInDown.duration(400).delay(150)}
                className='mx-4'
              >
                <View className='flex-row items-center px-4 py-3 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl'>
                  <View className='w-12 h-12 rounded-full overflow-hidden bg-black/10 dark:bg-white/10 justify-center items-center mr-3'>
                    {event.organization.image_url ? (
                      <Image
                        source={{ uri: event.organization.image_url }}
                        className='w-full h-full'
                        resizeMode='cover'
                      />
                    ) : (
                      <Text className='text-black dark:text-white font-groteskSemibold text-sm'>
                        {getInitials(event.organization.name)}
                      </Text>
                    )}
                  </View>
                  <View className='flex-1'>
                    <Text className='text-black dark:text-white font-groteskSemibold text-base leading-5'>
                      {event.organization.name}
                    </Text>
                    <Text className='text-black/60 dark:text-white/60 text-sm font-grotesk'>
                      {event.category.name}
                    </Text>
                  </View>

                  {/* Share Button */}
                  <Animated.View style={shareAnimatedStyle}>
                    <TouchableOpacity
                      onPress={handleShare}
                      activeOpacity={0.8}
                      className='p-3 rounded-full bg-accentBlue'
                    >
                      <Feather name='share-2' size={18} color='white' />
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </Animated.View>

              {/* Simplified Event Details Section */}
              <View className='mx-4'>
                <View className='bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4'>
                  <Text className='text-black dark:text-white font-groteskSemibold text-lg mb-4'>
                    {t('eventDetails')}
                  </Text>

                  <View className='space-y-3'>
                    {/* Date and Time */}
                    <View className='flex-row items-center'>
                      <View className='w-8 h-8 rounded-full bg-accentBlue/15 items-center justify-center mr-3'>
                        <Feather name='calendar' size={14} color='#2066DF' />
                      </View>
                      <View className='flex-1'>
                        <Text className='text-black dark:text-white font-groteskSemibold text-sm'>
                          {formatDateRangeShort(event.starts_at, event.ends_at)}
                        </Text>
                        <Text className='text-black/60 dark:text-white/60 text-xs'>
                          {formatTimeRangeShort(event.starts_at, event.ends_at)}
                        </Text>
                      </View>
                    </View>

                    {/* Location */}
                    {event.location && (
                      <View className='flex-row items-center'>
                        <View className='w-8 h-8 rounded-full bg-accentPink/15 items-center justify-center mr-3'>
                          <Feather name='map-pin' size={14} color='#EC2E81' />
                        </View>
                        <View className='flex-1'>
                          <Text
                            className='text-black dark:text-white font-groteskSemibold text-sm'
                            numberOfLines={2}
                          >
                            {event.location}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={handleMapPress}
                          className='p-1'
                          activeOpacity={0.7}
                        >
                          <Feather
                            name='external-link'
                            size={14}
                            color={iconPrimary}
                          />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Category */}
                    <View className='flex-row items-center'>
                      <View className='w-8 h-8 rounded-full bg-accentBlue/15 items-center justify-center mr-3'>
                        <Feather name='tag' size={14} color='#2066DF' />
                      </View>
                      <View className='flex-1'>
                        <Text className='text-black dark:text-white font-groteskSemibold text-sm'>
                          {event.category.name}
                        </Text>
                      </View>
                      {event.is_new && (
                        <View className='px-2 py-1 rounded-full bg-accentPink'>
                          <Text className='text-white text-xs font-groteskSemibold'>
                            {t('newTag')}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Quick Actions */}
                    <View className='flex-row gap-2 mt-2 pt-3 border-t border-black/10 dark:border-white/10'>
                      <TouchableOpacity
                        onPress={handleAddToCalendar}
                        className='flex-1 bg-accentBlue/10 rounded-lg py-2 px-3 flex-row items-center justify-center'
                        activeOpacity={0.7}
                      >
                        <Feather name='plus' size={14} color='#2066DF' />
                        <Text className='text-accentBlue font-groteskMedium text-xs ml-1'>
                          {t('addToCalendar')}
                        </Text>
                      </TouchableOpacity>

                      {event.url && (
                        <Animated.View
                          style={ctaAnimatedStyle}
                          className='flex-1'
                        >
                          <TouchableOpacity
                            onPress={handleExternalLink}
                            className='flex-1 bg-accentPink/10 rounded-lg py-2 px-3 flex-row items-center justify-center'
                            activeOpacity={0.7}
                          >
                            <Feather
                              name='external-link'
                              size={14}
                              color='#EC2E81'
                            />
                            <Text className='text-accentPink font-groteskMedium text-xs ml-1'>
                              {t('visitPage')}
                            </Text>
                          </TouchableOpacity>
                        </Animated.View>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {/* Event Description */}
              {event.description && (
                <View className='mx-4'>
                  <View className='bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4'>
                    <Text className='text-black dark:text-white font-groteskSemibold text-lg mb-3'>
                      {t('eventDescription')}
                    </Text>

                    <View className='relative'>
                      <Text className='text-black/90 dark:text-white/90 text-sm leading-6 font-grotesk'>
                        {isDescriptionExpanded
                          ? event.description
                          : `${event.description.slice(0, 200)}${
                              event.description.length > 200 ? '...' : ''
                            }`}
                      </Text>

                      {event.description.length > 200 &&
                        !isDescriptionExpanded && (
                          <Animated.View
                            pointerEvents='none'
                            style={[
                              {
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                height: 20,
                              },
                              animatedGradientStyle,
                            ]}
                          >
                            <LinearGradient
                              pointerEvents='none'
                              colors={
                                isDark
                                  ? ['rgba(0,0,0,0)', 'rgba(0,0,0,1)']
                                  : [
                                      'rgba(255,255,255,0)',
                                      'rgba(255,255,255,1)',
                                    ]
                              }
                              start={{ x: 0, y: 0 }}
                              end={{ x: 0, y: 1 }}
                              style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0,
                              }}
                            />
                          </Animated.View>
                        )}
                    </View>

                    {event.description.length > 200 && (
                      <TouchableOpacity
                        onPress={handleDescriptionToggle}
                        activeOpacity={0.7}
                        className='mt-3 self-start bg-accentBlue/10 rounded-lg py-2 px-3 flex-row items-center'
                      >
                        <Text className='text-accentBlue font-groteskMedium text-xs mr-1'>
                          {isDescriptionExpanded ? t('collapse') : t('expand')}
                        </Text>
                        <Feather
                          name={
                            isDescriptionExpanded
                              ? 'chevron-up'
                              : 'chevron-down'
                          }
                          size={12}
                          color='#2066DF'
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </Animated.View>
          )}

          {activeTab === 'posts' && (
            <View className='mx-4'>
              <PostsTabContent
                isActive={true}
                event={event}
                isDark={isDark}
                iconPrimary={iconPrimary}
                dummyPosts={getDummyPosts(event.organization.name)}
                formatPostTime={formatPostTime}
                getInitials={getInitials}
                organizationImageUrl={event.organization.image_url || undefined}
              />
            </View>
          )}

          {activeTab === 'schedule' && (
            <Animated.View
              key='schedule'
              entering={FadeInDown.duration(300)}
              className='flex-1 mx-4'
            >
              {/* Week Day Selector */}
              {eventDays.length > 1 && (
                <WeekDaySelector
                  selectedDay={selectedDay}
                  onDaySelect={setSelectedDay}
                  days={eventDays}
                />
              )}

              {/* Schedule Items for Selected Day */}
              <ScrollView
                ref={scheduleScrollRef}
                showsVerticalScrollIndicator={false}
                className='flex-1'
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View className='space-y-2'>
                  {(
                    dummyScheduleByDay[
                      selectedDay as keyof typeof dummyScheduleByDay
                    ] || []
                  ).map((item, index) => {
                    const isPast = isEventPast(
                      selectedDay,
                      item.time,
                      item.endTime
                    );
                    const isCurrent = isEventCurrent(
                      selectedDay,
                      item.time,
                      item.endTime
                    );

                    return (
                      <Animated.View
                        key={item.id}
                        entering={FadeInDown.duration(200).delay(index * 40)}
                        className={`rounded-xl p-3 border ${
                          isCurrent
                            ? 'bg-accentBlue/10 border-accentBlue/30'
                            : isPast
                            ? 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5'
                            : 'bg-white dark:bg-black border-black/10 dark:border-white/10'
                        }`}
                      >
                        {/* Current event indicator */}
                        {isCurrent && (
                          <View className='absolute -left-1 top-4 w-1 h-6 bg-accentBlue rounded-full' />
                        )}

                        <View className='flex-row'>
                          {/* Compact Time */}
                          <View className='w-16 mr-3'>
                            <View
                              className={`rounded-lg px-2 py-1 border ${
                                isCurrent
                                  ? 'bg-accentBlue border-accentBlue'
                                  : isPast
                                  ? 'bg-black/10 dark:bg-white/10 border-black/20 dark:border-white/20'
                                  : 'bg-accentBlue/15 border-accentBlue/30'
                              }`}
                            >
                              <Text
                                className={`font-groteskSemibold text-xs text-center ${
                                  isCurrent
                                    ? 'text-white'
                                    : isPast
                                    ? 'text-black/40 dark:text-white/40'
                                    : 'text-accentBlue'
                                }`}
                              >
                                {item.time}
                              </Text>
                            </View>
                            <Text
                              className={`font-grotesk text-xs text-center mt-1 ${
                                isPast
                                  ? 'text-black/30 dark:text-white/30'
                                  : 'text-black/40 dark:text-white/40'
                              }`}
                            >
                              {item.duration}
                            </Text>
                          </View>

                          {/* Content */}
                          <View className='flex-1'>
                            <View className='flex-row items-start justify-between mb-1'>
                              <Text
                                className={`font-groteskSemibold text-sm flex-1 ${
                                  isCurrent
                                    ? 'text-accentBlue'
                                    : isPast
                                    ? 'text-black/50 dark:text-white/50'
                                    : 'text-black dark:text-white'
                                }`}
                              >
                                {item.title}
                              </Text>
                              {isCurrent && (
                                <View className='ml-2 px-2 py-0.5 bg-accentBlue rounded-full'>
                                  <Text className='text-white text-xs font-groteskSemibold'>
                                    {t('live')}
                                  </Text>
                                </View>
                              )}
                              {isPast && (
                                <Feather
                                  name='check-circle'
                                  size={14}
                                  color='#10B981'
                                />
                              )}
                            </View>
                            <Text
                              className={`font-grotesk text-xs leading-4 mb-1 ${
                                isPast
                                  ? 'text-black/40 dark:text-white/40'
                                  : 'text-black/70 dark:text-white/70'
                              }`}
                            >
                              {item.description}
                            </Text>
                            {item.speaker && (
                              <View className='flex-row items-center'>
                                <Feather
                                  name='user'
                                  size={10}
                                  color={
                                    isPast
                                      ? isDark
                                        ? '#FFFFFF40'
                                        : '#00000040'
                                      : iconPrimary
                                  }
                                />
                                <Text
                                  className={`font-groteskMedium text-xs ml-1 ${
                                    isPast
                                      ? 'text-black/40 dark:text-white/40'
                                      : 'text-black/60 dark:text-white/60'
                                  }`}
                                >
                                  {item.speaker}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </Animated.View>
                    );
                  })}
                </View>
              </ScrollView>

              <View className='bg-accentPink/10 border border-accentPink/30 rounded-xl p-3 mt-3'>
                <View className='flex-row items-center mb-1'>
                  <Feather name='info' size={14} color='#EC2E81' />
                  <Text className='text-accentPink font-groteskSemibold text-sm ml-1.5'>
                    {t('scheduleNote')}
                  </Text>
                </View>
                <Text className='text-accentPink/80 font-grotesk text-xs'>
                  {t('scheduleNoteDescription')}
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
