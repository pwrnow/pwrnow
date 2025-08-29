import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Modal,
  Linking,
  Image,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import { Feather } from '@expo/vector-icons';
import LikeButton from './LikeButton';
import * as Haptics from 'expo-haptics';
import { Event } from '../types';
import { useAnalytics } from '../lib/analytics';
import { useCalendar } from '../hooks/useCalendar';
import { t, deviceLocaleTag } from '../lib/i18n';
import { useAuth } from '../contexts/AuthContext';
import SignInRequiredModal from './SignInRequiredModal';
import { useLikeEvent, useUnlikeEvent } from '../lib/queries';

interface EventCardProps {
  event: Event;
  index?: number;
}

export default function EventCard({ event, index = 0 }: EventCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconPrimary = isDark ? '#FFFFFF' : '#000000';
  const [isDescriptionExpanded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const analytics = useAnalytics();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(!!event.liked);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { handleAddToCalendar } = useCalendar({ event });

  // React Query mutations for like/unlike
  const likeMutation = useLikeEvent();
  const unlikeMutation = useUnlikeEvent();

  // Sync local liked state from backend when event data updates
  useEffect(() => {
    setIsLiked(!!event.liked);
  }, [event.liked]);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const DOUBLE_TAP_DELAY_MS = 280;

  // CTA button animations
  const ctaScale = useSharedValue(1);
  const ctaBreath = useSharedValue(0);
  const ringProgress = useSharedValue(0);

  // Subtle breathing animation for CTA to increase emotional engagement
  useEffect(() => {
    ctaBreath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800 }),
        withTiming(0, { duration: 1800 })
      ),
      -1,
      true
    );
  }, [ctaBreath]);

  const ctaAnimatedStyle = useAnimatedStyle(() => {
    const scale = ctaScale.value * (1 + 0.01 * ctaBreath.value);
    return {
      transform: [{ scale }],
    };
  });

  const pulseRingStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        ringProgress.value,
        [0, 1],
        [0.15, 0],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            ringProgress.value,
            [0, 1],
            [1, 1.3],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  // Mirror the website behavior: only treat 1:1 as square; otherwise crop to a 16:9 frame
  const getAspectRatio = (ratio?: string | null): number => {
    return ratio === '1:1' ? 1 : 16 / 9;
  };

  const imageAspectRatio = getAspectRatio(event.aspect_ratio);

  const handleHeartPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked); // Optimistic update
    analytics.trackEventFavoriteToggled(event as any, nextLiked);

    try {
      if (nextLiked) {
        await likeMutation.mutateAsync(event.slug);
      } else {
        await unlikeMutation.mutateAsync(event.slug);
      }
    } catch (e) {
      // Revert optimistic update on error
      setIsLiked(!nextLiked);
      console.error('Like/unlike failed:', e);
    }
  };

  // Calendar functionality moved to useCalendar hook

  const handleEventLinkPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to local event detail page instead of external URL
    router.push(`/wydarzenia/${event.slug}` as any);
    analytics.trackEventImageClicked(event as any);
  };

  // Handle double-tap on image only; single tap navigates
  const handleImagePress = () => {
    const now = Date.now();
    if (now - (lastTapRef.current || 0) < DOUBLE_TAP_DELAY_MS) {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      lastTapRef.current = 0;
      handleHeartPress();
      return;
    }
    lastTapRef.current = now;
    tapTimeoutRef.current = setTimeout(() => {
      handleEventLinkPress();
      tapTimeoutRef.current = null;
    }, DOUBLE_TAP_DELAY_MS);
  };

  const handleCtaPressIn = async () => {
    ctaScale.value = withSpring(0.96, { damping: 14, stiffness: 300 });
    ringProgress.value = 0;
    ringProgress.value = withTiming(1, { duration: 650 });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCtaPressOut = () => {
    ctaScale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const handleMapPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = `https://maps.apple.com/?q=${encodeURIComponent(
      event.location || ''
    )}`;
    await Linking.openURL(url);
    analytics.trackEventPillClicked(event as any, 'location');
  };

  // Share removed from card in this redesign

  const handleDatePillPress = async () => {
    await handleAddToCalendar();
    analytics.trackEventPillClicked(event as any, 'date');
  };

  const handleTimePillPress = async () => {
    await handleAddToCalendar();
    analytics.trackEventPillClicked(event as any, 'time');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

  const isToday = (dateString: string) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    return (
      today.getDate() === eventDate.getDate() &&
      today.getMonth() === eventDate.getMonth() &&
      today.getFullYear() === eventDate.getFullYear()
    );
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
      return `${day(startDate)} ${monthLong(startDate)}$${
        shouldShowYear ? ` ${startDate.getFullYear()}` : ''
      }`.replace('$', '');
    }

    if (sameMonthAndYear) {
      return `${day(startDate)}–${day(endDate)} ${monthLong(startDate)}$${
        shouldShowYear ? ` ${startDate.getFullYear()}` : ''
      }`.replace('$', '');
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

  return (
    <Animated.View
      entering={FadeInDown.duration(420)
        .delay(Math.min(index, 30) * 45)
        .springify()
        .damping(18)
        .stiffness(160)}
      layout={LinearTransition.springify().damping(20).stiffness(180)}
      className='mb-0 bg-white dark:bg-black'
    >
      <Pressable onPress={handleEventLinkPress}>
        {/* Header: org + category */}
        <View className='px-3 pt-4 pb-3'>
          <View className='flex-row items-center gap-3'>
            <View className='w-10 h-10 rounded-full overflow-hidden bg-black/10 dark:bg-white/10 justify-center items-center'>
              {event.organization.image_url ? (
                <Image
                  source={{ uri: event.organization.image_url }}
                  className='w-full h-full'
                  resizeMode='cover'
                />
              ) : (
                <Text className='text-black dark:text-white font-semibold text-sm'>
                  {getInitials(event.organization.name)}
                </Text>
              )}
            </View>
            <View className='flex-1'>
              <Text
                className='text-black dark:text-white font-semibold text-base leading-5'
                numberOfLines={1}
              >
                {event.organization.name}
              </Text>
              <Text className='text-black/65 dark:text-white/65 text-xs leading-4 mt-[1px]'>
                {event.category.name}
              </Text>
            </View>
            {event.is_new ? (
              <View className='px-2.5 py-1.5 rounded-xl bg-accentPink/15 border border-accentPink/30'>
                <Text className='text-accentPink text-xs font-semibold tracking-[0.5px]'>
                  {t('newTag')}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Image */}
        {event.image_url ? (
          <View>
            <Pressable onPress={handleImagePress}>
              <View
                className='w-full overflow-hidden bg-black/5 dark:bg-muted'
                style={{ aspectRatio: imageAspectRatio }}
              >
                <Image
                  source={{ uri: event.image_url }}
                  onLoadStart={() => setIsImageLoading(true)}
                  onLoadEnd={() => setIsImageLoading(false)}
                  className='w-full h-full'
                  resizeMode='cover'
                />
              </View>
            </Pressable>
          </View>
        ) : null}

        {/* Content */}
        <Pressable onPress={handleEventLinkPress} className='px-3 pt-4 pb-5'>
          {/* Title and Share */}
          <View className='flex-row items-start'>
            <View className='flex-1 mr-3'>
              <Text
                className='text-black dark:text-white font-semibold text-2xl leading-7 mb-2'
                numberOfLines={3}
              >
                {event.title}
              </Text>
            </View>
            <LikeButton
              isLiked={isLiked}
              onPress={handleHeartPress}
              size={24}
              className='-mr-1'
              stopPropagationOnPress
              isAuthenticated={isAuthenticated}
            />
          </View>

          {/* Meta chips under title */}
          <View className='gap-2 mb-1.5'>
            <View className='flex-row gap-2'>
              {/* Date range chip */}
              <View className='flex-row items-center py-1.5 px-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10'>
                <Feather name='calendar' size={12} color={iconPrimary} />
                <Text className='text-black dark:text-white text-xs font-medium ml-1.5'>
                  {formatDateRangeShort(event.starts_at, event.ends_at)}
                </Text>
              </View>

              {/* Time chip */}
              <View className='flex-row items-center py-1.5 px-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10'>
                <Feather name='clock' size={12} color={iconPrimary} />
                <Text className='text-black dark:text-white text-xs font-medium ml-1.5'>
                  {formatTimeRangeShort(event.starts_at, event.ends_at)}
                </Text>
              </View>
            </View>

            {/* Location chip on its own row */}
            {event.location ? (
              <View className='self-start flex-row items-center py-1.5 px-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 max-w-full'>
                <Feather name='map-pin' size={12} color={iconPrimary} />
                <Text className='text-black dark:text-white text-xs font-medium ml-1.5'>
                  {event.location}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Description (truncated, no expand in this redesign) */}
          {event.description ? (
            <View className='mb-2'>
              <Text className='text-black/90 dark:text-white/90 text-base leading-6 font-sans'>
                {`${event.description.slice(0, 150)}${
                  event.description.length > 150 ? '...' : ''
                }`}
              </Text>
            </View>
          ) : null}

          <SignInRequiredModal
            visible={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSignIn={() => {
              setShowAuthModal(false);
              router.push('/signin' as any);
            }}
          />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}
