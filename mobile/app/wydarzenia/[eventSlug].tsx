import { useEffect, useState, useCallback } from 'react';
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

const { width: screenWidth } = Dimensions.get('window');

type TabType = 'details' | 'posts' | 'schedule';

interface TabConfig {
  key: TabType;
  title: string;
  icon: string;
}

const tabs: TabConfig[] = [
  { key: 'details', title: 'details', icon: 'info' },
  { key: 'posts', title: 'posts', icon: 'message-circle' },
  { key: 'schedule', title: 'schedule', icon: 'calendar' },
];

// Custom Tab Navigator Component
interface TabNavigatorProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isDark: boolean;
}

const TabNavigator: React.FC<TabNavigatorProps> = ({ activeTab, onTabChange, isDark }) => {
  const indicatorPosition = useSharedValue(0);
  const tabWidth = screenWidth / tabs.length - 16; // Account for padding

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
    indicatorPosition.value = withSpring(activeIndex * (tabWidth + 8), {
      damping: 20,
      stiffness: 300,
    });
  }, [activeTab, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
  }));

  const handleTabPress = useCallback((tab: TabType) => {
    Haptics.selectionAsync();
    onTabChange(tab);
  }, [onTabChange]);

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(200)}
      className='px-4 pt-4 pb-2'
    >
      <View className='relative bg-black/5 dark:bg-white/5 rounded-xl p-1 border border-black/10 dark:border-white/10'>
        {/* Animated Indicator */}
        <Animated.View
          style={[
            indicatorStyle,
            {
              width: tabWidth,
              top: 4,
              bottom: 4,
              left: 4,
              shadowColor: '#000',
              shadowOpacity: isDark ? 0 : 0.08,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            }
          ]}
          className='absolute bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/20'
        />

        {/* Tab Buttons */}
        <View className='flex-row relative z-10'>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => handleTabPress(tab.key)}
              className='flex-1 py-2.5 px-3 rounded-lg items-center justify-center'
              activeOpacity={0.7}
            >
              <View className='flex-row items-center'>
                <Feather
                  name={tab.icon as any}
                  size={16}
                  color={
                    activeTab === tab.key
                      ? (isDark ? '#FFFFFF' : '#000000')
                      : (isDark ? '#FFFFFF60' : '#00000060')
                  }
                />
                <Text
                  className={`ml-2 font-groteskMedium text-sm ${
                    activeTab === tab.key
                      ? 'text-black dark:text-white'
                      : 'text-black/60 dark:text-white/60'
                  }`}
                >
                  {t(tab.title)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

// Tab Content Components
interface TabContentProps {
  isActive: boolean;
  event: Event;
  isDark: boolean;
  iconPrimary: string;
  isDescriptionExpanded: boolean;
  onDescriptionToggle: () => void;
  gradientOpacity: Animated.SharedValue<number>;
  animatedGradientStyle: any;
}

const DetailsTabContent: React.FC<TabContentProps> = ({
  isActive,
  event,
  isDark,
  isDescriptionExpanded,
  onDescriptionToggle,
  animatedGradientStyle
}) => {
  if (!isActive) return null;

  return (
    <Animated.View
      key="details"
      entering={FadeInDown.duration(300)}
      exiting={FadeInDown.duration(150)}
      className='space-y-4'
    >
      {event.description && (
        <View className='bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4'>
          <Text className='text-black dark:text-white font-groteskSemibold text-lg mb-3'>
            {t('eventDescription')}
          </Text>

          <View className='relative'>
            <Text className='text-black/90 dark:text-white/90 text-base leading-6 font-grotesk'>
              {isDescriptionExpanded
                ? event.description
                : `${event.description.slice(0, 150)}${
                    event.description.length > 150 ? '...' : ''
                  }`}
            </Text>

            {event.description.length > 150 && !isDescriptionExpanded && (
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
                      : ['rgba(255,255,255,0)', 'rgba(255,255,255,1)']
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

          {event.description.length > 150 && (
            <TouchableOpacity
              onPress={onDescriptionToggle}
              activeOpacity={0.7}
              className='mt-3 self-start flex-row items-center py-1.5 px-3 rounded-lg bg-black/5 dark:bg-white/5'
            >
              <Text className='text-accentBlue font-groteskMedium text-sm mr-1'>
                {isDescriptionExpanded ? t('collapse') : t('expand')}
              </Text>
              <Feather
                name={isDescriptionExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color='#2066DF'
              />
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const PostsTabContent: React.FC<TabContentProps & { dummyPosts: any[], formatPostTime: (timestamp: string) => string, getInitials: (name: string) => string, handlePostLike: (postId: string) => void, handlePostComment: (postId: string) => void }> = ({
  isActive,
  iconPrimary,
  dummyPosts,
  formatPostTime,
  getInitials,
  handlePostLike,
  handlePostComment
}) => {
  if (!isActive) return null;

  return (
    <Animated.View
      key="posts"
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
          <View className='flex-row items-center mb-2'>
            <View className='w-8 h-8 rounded-full bg-accentBlue/20 justify-center items-center mr-2.5'>
              <Text className='text-accentBlue font-groteskSemibold text-xs'>
                {getInitials(post.author)}
              </Text>
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

          <Text className='text-black/90 dark:text-white/90 font-grotesk text-sm leading-5 mb-3'>
            {post.content}
          </Text>

          <View className='flex-row items-center gap-4'>
            <TouchableOpacity
              onPress={() => handlePostLike(post.id)}
              className='flex-row items-center gap-1.5'
              activeOpacity={0.7}
            >
              <Feather name='heart' size={14} color={iconPrimary} />
              <Text className='text-black/60 dark:text-white/60 font-groteskMedium text-xs'>
                {post.likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handlePostComment(post.id)}
              className='flex-row items-center gap-1.5'
              activeOpacity={0.7}
            >
              <Feather name='message-circle' size={14} color={iconPrimary} />
              <Text className='text-black/60 dark:text-white/60 font-groteskMedium text-xs'>
                {post.comments}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ))}

      <TouchableOpacity
        className='bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 items-center'
        activeOpacity={0.7}
      >
        <Text className='text-accentBlue font-groteskMedium text-sm'>
          {t('loadMorePosts')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ScheduleTabContent: React.FC<TabContentProps & { dummySchedule: any[], iconPrimary: string }> = ({
  isActive,
  iconPrimary,
  dummySchedule
}) => {
  if (!isActive) return null;

  return (
    <Animated.View
      key="schedule"
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

// Dummy data for demonstration
const dummyPosts = [
  {
    id: '1',
    author: 'Organizator wydarzenia',
    content: 'Witamy wszystkich uczestników! Nie możemy się doczekać wspaniałego wydarzenia. Przygotowaliśmy dla Was wiele niespodzianek!',
    timestamp: '2024-03-15T10:30:00Z',
    likes: 24,
    comments: 5,
  },
  {
    id: '2',
    author: 'Jan Kowalski',
    content: 'Bardzo się cieszę, że mogę uczestniczyć w tym wydarzeniu! Kto jeszcze będzie?',
    timestamp: '2024-03-15T09:15:00Z',
    likes: 12,
    comments: 3,
  },
  {
    id: '3',
    author: 'Anna Nowak',
    content: 'Świetna organizacja! Polecam wszystkim zainteresowanym tematyką.',
    timestamp: '2024-03-14T16:45:00Z',
    likes: 18,
    comments: 7,
  },
];

const dummySchedule = [
  {
    id: '1',
    time: '09:00',
    title: 'Rejestracja uczestników',
    description: 'Odbiór identyfikatorów i materiałów konferencyjnych',
    speaker: null,
    duration: '30 min',
  },
  {
    id: '2',
    time: '09:30',
    title: 'Ceremonia otwarcia',
    description: 'Powitanie uczestników i wprowadzenie do wydarzenia',
    speaker: 'Maria Kowalska',
    duration: '30 min',
  },
  {
    id: '3',
    time: '10:00',
    title: 'Prezentacja główna',
    description: 'Najnowsze trendy w branży i przyszłość rozwoju',
    speaker: 'Dr Piotr Nowak',
    duration: '60 min',
  },
  {
    id: '4',
    time: '11:00',
    title: 'Przerwa kawowa',
    description: 'Networking i refreshment',
    speaker: null,
    duration: '30 min',
  },
  {
    id: '5',
    time: '11:30',
    title: 'Panel dyskusyjny',
    description: 'Wyzwania i możliwości w obecnej sytuacji rynkowej',
    speaker: 'Panel ekspertów',
    duration: '90 min',
  },
  {
    id: '6',
    time: '13:00',
    title: 'Lunch break',
    description: 'Wspólny posiłek i dalszy networking',
    speaker: null,
    duration: '60 min',
  },
];

export default function EventDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconPrimary = isDark ? '#FFFFFF' : '#000000';
  const { eventSlug } = useLocalSearchParams();
  const router = useRouter();
  const analytics = useAnalytics();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Animation values
  const shareScale = useSharedValue(1);
  const ctaScale = useSharedValue(1);
  const gradientOpacity = useSharedValue(1);

  const {
    data: event,
    isLoading,
    error,
  } = useEventBySlug(typeof eventSlug === 'string' ? eventSlug : undefined);

  // Tab change handler with proper state management
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

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
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return t('justNow');
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  const handlePostLike = async (postId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Handle like action
  };

  const handlePostComment = async (postId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Handle comment action
  };

  const handleDescriptionToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDescriptionExpanded(!isDescriptionExpanded);
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
          <Feather
            name='arrow-left'
            size={24}
            color={iconPrimary}
          />
        </TouchableOpacity>
        <Text
          className='flex-1 text-center text-lg font-groteskSemibold text-black dark:text-white mx-4'
          numberOfLines={1}
        >
          {event.title}
        </Text>
        <Animated.View style={shareAnimatedStyle}>
          <TouchableOpacity
            className='p-2 -mr-2'
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Feather
              name='share-2'
              size={24}
              color={iconPrimary}
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} className='flex-1'>
        {/* Hero Section with Image and Key Info */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          {/* Event Image */}
          {event.image_url && (
            <View className='relative'>
              <Image
                source={{ uri: event.image_url }}
                className='w-full'
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
                }}
              />
              {/* New badge overlay */}
              {event.is_new && (
                <View className='absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-accentPink'>
                  <Text className='text-white text-xs font-groteskSemibold'>
                    {t('newTag')}
                  </Text>
                </View>
              )}

              {/* Overlaid Key Info */}
              <View className='absolute bottom-4 left-4 right-4'>
                <View className='flex-row gap-2 mb-3'>
                  <TouchableOpacity
                    onPress={handleAddToCalendar}
                    activeOpacity={0.8}
                    className='flex-row items-center py-1.5 px-3 rounded-full bg-white/90 backdrop-blur'
                  >
                    <Feather name='calendar' size={12} color='#2066DF' />
                    <Text className='text-black text-xs font-groteskMedium ml-1.5'>
                      {formatDateRangeShort(event.starts_at, event.ends_at)}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleAddToCalendar}
                    activeOpacity={0.8}
                    className='flex-row items-center py-1.5 px-3 rounded-full bg-white/90 backdrop-blur'
                  >
                    <Feather name='clock' size={12} color='#EC2E81' />
                    <Text className='text-black text-xs font-groteskMedium ml-1.5'>
                      {formatTimeRangeShort(event.starts_at, event.ends_at)}
                    </Text>
                  </TouchableOpacity>
                </View>

                {event.location && (
                  <TouchableOpacity
                    onPress={handleMapPress}
                    activeOpacity={0.8}
                    className='flex-row items-center py-1.5 px-3 rounded-full bg-white/90 backdrop-blur self-start'
                  >
                    <Feather name='map-pin' size={12} color='#000' />
                    <Text className='text-black text-xs font-groteskMedium ml-1.5' numberOfLines={1}>
                      {event.location}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Organization Header - More Compact */}
          <View className='flex-row items-center px-4 py-3 bg-black/2 dark:bg-white/2'>
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

            {/* Quick Action Button */}
            {event.url && (
              <Animated.View style={ctaAnimatedStyle}>
                <TouchableOpacity
                  onPress={handleExternalLink}
                  activeOpacity={0.8}
                  className='px-4 py-2 rounded-full bg-accentBlue'
                >
                  <Text className='text-white font-groteskSemibold text-sm'>
                    {t('visitPage')}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* Tabs */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} className='px-4 pt-4 pb-2'>
          <View className='bg-black/5 dark:bg-white/5 rounded-xl p-1 border border-black/10 dark:border-white/10'>
            <View className='flex-row'>
              {(['details', 'posts', 'schedule'] as TabType[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => handleTabChange(tab)}
                  className={`flex-1 py-2.5 px-3 rounded-lg ${
                    activeTab === tab
                      ? 'bg-white dark:bg-black shadow-sm border border-black/10 dark:border-white/20'
                      : 'bg-transparent'
                  }`}
                  style={
                    activeTab === tab && !isDark
                      ? {
                          shadowColor: '#000',
                          shadowOpacity: 0.08,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 1 },
                          elevation: 2,
                        }
                      : undefined
                  }
                >
                  <Text
                    className={`text-center font-groteskMedium text-sm ${
                      activeTab === tab
                        ? 'text-black dark:text-white'
                        : 'text-black/60 dark:text-white/60'
                    }`}
                  >
                    {tab === 'details'
                      ? t('details')
                      : tab === 'posts'
                      ? t('posts')
                      : t('schedule')
                    }
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Tab Content */}
        <View className='flex-1 px-4 pb-8'>
          {activeTab === 'details' && (
            <Animated.View
              key="details"
              entering={FadeInDown.duration(300)}
              className='space-y-4'
            >
              {/* Description */}
              {event.description && (
                <View className='bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4'>
                  <Text className='text-black dark:text-white font-groteskSemibold text-lg mb-3'>
                    {t('eventDescription')}
                  </Text>

                  <View className='relative'>
                    <Text className='text-black/90 dark:text-white/90 text-base leading-6 font-grotesk'>
                      {isDescriptionExpanded
                        ? event.description
                        : `${event.description.slice(0, 150)}${
                            event.description.length > 150 ? '...' : ''
                          }`}
                    </Text>

                    {event.description.length > 150 && !isDescriptionExpanded && (
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
                              : ['rgba(255,255,255,0)', 'rgba(255,255,255,1)']
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

                  {event.description.length > 150 && (
                    <TouchableOpacity
                      onPress={handleDescriptionToggle}
                      activeOpacity={0.7}
                      className='mt-3 self-start flex-row items-center py-1.5 px-3 rounded-lg bg-black/5 dark:bg-white/5'
                    >
                      <Text className='text-accentBlue font-groteskMedium text-sm mr-1'>
                        {isDescriptionExpanded ? t('collapse') : t('expand')}
                      </Text>
                      <Feather
                        name={isDescriptionExpanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color='#2066DF'
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Animated.View>
          )}

          {activeTab === 'posts' && (
            <Animated.View
              key="posts"
              entering={FadeInDown.duration(300)}
              className='space-y-3'
            >
              {dummyPosts.map((post, index) => (
                <Animated.View
                  key={post.id}
                  entering={FadeInDown.duration(200).delay(index * 50)}
                  className='bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4'
                >
                  {/* Compact Post Header */}
                  <View className='flex-row items-center mb-2'>
                    <View className='w-8 h-8 rounded-full bg-accentBlue/20 justify-center items-center mr-2.5'>
                      <Text className='text-accentBlue font-groteskSemibold text-xs'>
                        {getInitials(post.author)}
                      </Text>
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
                  <Text className='text-black/90 dark:text-white/90 font-grotesk text-sm leading-5 mb-3'>
                    {post.content}
                  </Text>

                  {/* Compact Post Actions */}
                  <View className='flex-row items-center gap-4'>
                    <TouchableOpacity
                      onPress={() => handlePostLike(post.id)}
                      className='flex-row items-center gap-1.5'
                      activeOpacity={0.7}
                    >
                      <Feather name='heart' size={14} color={iconPrimary} />
                      <Text className='text-black/60 dark:text-white/60 font-groteskMedium text-xs'>
                        {post.likes}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handlePostComment(post.id)}
                      className='flex-row items-center gap-1.5'
                      activeOpacity={0.7}
                    >
                      <Feather name='message-circle' size={14} color={iconPrimary} />
                      <Text className='text-black/60 dark:text-white/60 font-groteskMedium text-xs'>
                        {post.comments}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}

              <TouchableOpacity
                className='bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 items-center'
                activeOpacity={0.7}
              >
                <Text className='text-accentBlue font-groteskMedium text-sm'>
                  {t('loadMorePosts')}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {activeTab === 'schedule' && (
            <Animated.View
              key="schedule"
              entering={FadeInDown.duration(300)}
              className='space-y-2'
            >
              {dummySchedule.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.duration(200).delay(index * 40)}
                  className='bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-3'
                >
                  <View className='flex-row'>
                    {/* Compact Time */}
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

                    {/* Content */}
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
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
