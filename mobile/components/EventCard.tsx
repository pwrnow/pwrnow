import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Image,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as Calendar from 'expo-calendar';
import { Event } from '../types';
import { config } from '../lib/config';
import { t, deviceLocaleTag } from '../lib/i18n';

interface EventCardProps {
  event: Event;
  index?: number;
}

export default function EventCard({ event, index = 0 }: EventCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconPrimary = isDark ? '#FFFFFF' : '#000000';
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Animated fade for the description gradient overlay (keeps fade when collapsed)
  const gradientOpacity = useSharedValue(1);
  // CTA button animations
  const ctaScale = useSharedValue(1);
  const ctaBreath = useSharedValue(0);
  const ringProgress = useSharedValue(0);
  useEffect(() => {
    gradientOpacity.value = withTiming(isDescriptionExpanded ? 0 : 1, {
      duration: 200,
    });
  }, [isDescriptionExpanded, gradientOpacity]);

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

  const animatedGradientStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));

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

  const getAspectRatio = (ratio?: string | null): number => {
    if (!ratio) return 16 / 9;
    // Handle explicit common labels
    if (ratio === '1:1') return 1;
    if (ratio === '16:9') return 16 / 9;
    if (ratio === '4:3') return 4 / 3;
    if (ratio === '3:2') return 3 / 2;
    // Handle generic WIDTH:HEIGHT strings like "1200:628"
    if (ratio.includes(':')) {
      const [widthString, heightString] = ratio.split(':');
      const width = parseFloat(widthString);
      const height = parseFloat(heightString);
      if (Number.isFinite(width) && Number.isFinite(height) && height > 0) {
        return width / height;
      }
    }
    return 16 / 9;
  };

  const imageAspectRatio = getAspectRatio(event.aspect_ratio);

  const handleDescriptionToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const handleAddToCalendar = async () => {
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

  const handleEventLinkPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = event.url || `${config.shareBaseUrl}/${event.slug}`;
    await Linking.openURL(url);
  };

  // Dedicated CTA handler without extra haptics (we trigger haptics on press-in)
  const handleVisitPagePress = async () => {
    const url = event.url || `${config.shareBaseUrl}/${event.slug}`;
    await Linking.openURL(url);
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
  };

  const handleShare = async () => {
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
              className='text-black dark:text-white font-semibold text-sm leading-4'
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
          <TouchableOpacity onPress={handleEventLinkPress} activeOpacity={0.92}>
            <View
              className='w-full overflow-visible bg-black/5 dark:bg-muted'
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
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Content */}
      <View className='px-3 pt-4 pb-5'>
        {/* Title and Share */}
        <View className='flex-row items-start'>
          <Text
            className='text-black dark:text-white font-semibold text-xl leading-6 flex-1 mr-3'
            numberOfLines={3}
          >
            {event.title}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            className='bg-accentPink/12 border border-accentPink/25 rounded-lg p-2.5'
          >
            <Feather name='share-2' size={18} color={'#EC2E81'} />
          </TouchableOpacity>
        </View>

        {/* Meta chips under title */}
        <View className='gap-2 mb-1.5'>
          <View className='flex-row gap-2'>
            {/* Date range chip */}
            <TouchableOpacity
              onPress={handleAddToCalendar}
              activeOpacity={0.7}
              className='flex-row items-center py-1.5 px-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10'
            >
              <Feather name='calendar' size={14} color={iconPrimary} />
              <Text className='text-black dark:text-white text-sm font-medium ml-1.5'>
                {formatDateRangeShort(event.starts_at, event.ends_at)}
              </Text>
            </TouchableOpacity>

            {/* Time chip */}
            <TouchableOpacity
              onPress={handleAddToCalendar}
              activeOpacity={0.7}
              className='flex-row items-center py-1.5 px-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10'
            >
              <Feather name='clock' size={14} color={iconPrimary} />
              <Text className='text-black dark:text-white text-sm font-medium ml-1.5'>
                {formatTimeRangeShort(event.starts_at, event.ends_at)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Location chip on its own row */}
          {event.location ? (
            <TouchableOpacity
              onPress={handleMapPress}
              activeOpacity={0.7}
              className='self-start flex-row items-center py-1.5 px-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 max-w-full'
            >
              <Feather name='map-pin' size={14} color={iconPrimary} />
              <Text className='text-black dark:text-white text-sm font-medium ml-1.5'>
                {event.location}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Description (truncated with expand/collapse + fade) */}
        {event.description ? (
          <View className='mb-2'>
            <View className='relative'>
              <Animated.View
                layout={LinearTransition.springify().damping(22).stiffness(200)}
              >
                <Text className='text-black/90 dark:text-white/90 text-base leading-[22px] font-sans'>
                  {isDescriptionExpanded
                    ? event.description
                    : `${event.description.slice(0, 150)}${
                        event.description.length > 150 ? '...' : ''
                      }`}
                </Text>
              </Animated.View>

              {event.description.length > 150 ? (
                <Animated.View
                  pointerEvents='none'
                  style={[
                    {
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 24,
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
              ) : null}
            </View>

            {event.description.length > 150 ? (
              <TouchableOpacity
                onPress={handleDescriptionToggle}
                activeOpacity={0.7}
                className='mt-1 self-start py-1 px-1.5 rounded-lg'
              >
                <View className='flex-row items-center'>
                  <Text className='text-accentBlue font-semibold text-sm mr-1'>
                    {isDescriptionExpanded ? t('collapse') : t('expand')}
                  </Text>
                  <Feather
                    name={isDescriptionExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={'#2066DF'}
                  />
                </View>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Improved CTA Button */}
        <TouchableOpacity
          onPress={handleVisitPagePress}
          onPressIn={handleCtaPressIn}
          onPressOut={handleCtaPressOut}
          activeOpacity={0.8}
          className='relative mt-1'
        >
          {/* Pulsing glow ring on tap */}
          <Animated.View
            pointerEvents='none'
            style={[
              {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                borderRadius: 16,
                zIndex: 1,
                backgroundColor: isDark
                  ? 'rgba(32, 102, 223, 0.20)'
                  : 'rgba(236, 46, 129, 0.20)',
              },
              pulseRingStyle,
            ]}
          />

          <Animated.View style={ctaAnimatedStyle}>
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(32, 102, 223, 0.32)', 'rgba(236, 46, 129, 0.32)']
                  : ['rgba(32, 102, 223, 0.5)', 'rgba(236, 46, 129, 0.5)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 14,
                padding: 1,
              }}
            >
              <View
                className='rounded-[13px] py-2.5 px-4 items-center justify-center border border-transparent dark:border-white/10 bg-white dark:bg-black/40'
                style={
                  isDark
                    ? undefined
                    : {
                        shadowColor: '#000',
                        shadowOpacity: 0.06,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2,
                      }
                }
              >
                <View className='flex-row items-center gap-2.5'>
                  <Feather name='arrow-right' size={18} color={iconPrimary} />
                  <Text className='text-black dark:text-white font-semibold text-base tracking-[0.5px]'>
                    {t('visitPage')}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
