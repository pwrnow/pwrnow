import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Linking,
} from 'react-native';
import CachedImage from './CachedImage';
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
import ShareButton from './ShareButton';
import * as Haptics from 'expo-haptics';
import { Event, Organization } from '../types';
import { useAnalytics } from '../lib/analytics';
import { useCalendar } from '../hooks/useCalendar';
import { t, deviceLocaleTag } from '../lib/i18n';
import { useAuth } from '../contexts/AuthContext';
import SignInRequiredModal from './SignInRequiredModal';
import FirstLikeModal from './FirstLikeModal';
import { useLikeEvent, useUnlikeEvent } from '../lib/queries';
import { useThemeColors } from '../hooks/useThemeColors';
import { useEventActions } from '../hooks/useEventActions';
import FriendsAttending from './FriendsAttending';
import FriendsInterestedModal from './FriendsInterestedModal';
import StaffBadge from './StaffBadge';
import OrganizationListModal from './OrganizationListModal';

interface EventCardProps {
  event: Event;
  index?: number;
}

export default function EventCard({ event, index = 0 }: EventCardProps) {
  const { colors } = useThemeColors();
  const iconPrimary = colors.foreground;
  const [isDescriptionExpanded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const analytics = useAnalytics();
  const router = useRouter();
  const { isAuthenticated, isStaff } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { handleAddToCalendar } = useCalendar({ event });

  // Friends interested data is now included in the event object

  // Use the event actions hook
  const { handleHeartPress, showFirstLikeModal, setShowFirstLikeModal } =
    useEventActions(event, setShowAuthModal);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showOrgsModal, setShowOrgsModal] = useState(false);

  // Get all organizations (admin + co-hosts)
  const allOrganizations = event.all_organizations || [event.organization];
  const hasCoHosts = allOrganizations.length > 1;
  // Show max 2 avatars + "+N" indicator (max 3 things total)
  const visibleOrgs = allOrganizations.slice(0, 2);
  const extraOrgsCount = allOrganizations.length - 2;

  // Get display name: prefer short_name, otherwise use full name
  const getDisplayName = (org: Organization | undefined) => {
    if (!org) return '';
    return org.short_name || org.display_name || org.name;
  };

  // Build organization names string with "&" separator
  const organizationNamesDisplay = allOrganizations
    .map((org) => getDisplayName(org))
    .join(' & ');



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

  // Calendar functionality moved to useCalendar hook

  // Badge logic
  const now = new Date();
  const startsAt = new Date(event.starts_at);
  const endsAt = new Date(event.ends_at);
  const isNow = now >= startsAt && now <= endsAt;
  const isSameDay =
    startsAt.getFullYear() === now.getFullYear() &&
    startsAt.getMonth() === now.getMonth() &&
    startsAt.getDate() === now.getDate();
  const isTodayOnly = !isNow && isSameDay;

  const handleEventLinkPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to local event detail page instead of external URL
    router.push(`/wydarzenia/${event.slug}` as any);
    analytics.trackEventImageClicked(event as any);
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
      style={{ backgroundColor: colors.background }}
      className='mb-0'
    >
      <Pressable onPress={handleEventLinkPress}>
        {/* Header: org + category */}
        <View className='px-3 pt-4 pb-3'>
          <View className='flex-row items-center gap-3'>
            {/* Stacked Avatars */}
            <Pressable 
              onPress={() => hasCoHosts && setShowOrgsModal(true)}
              className='flex-row items-center'
            >
              {visibleOrgs.map((org, index) => (
                <View
                  key={org.id}
                  style={{ 
                    backgroundColor: colors.muted,
                    marginLeft: index > 0 ? -12 : 0,
                    zIndex: visibleOrgs.length - index,
                    borderWidth: 2,
                    borderColor: colors.background,
                  }}
                  className='w-10 h-10 rounded-full overflow-hidden justify-center items-center'
                >
                  {org.image_url ? (
                    <CachedImage
                      source={{ uri: org.image_url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit='cover'
                    />
                  ) : (
                    <Text
                      style={{ color: colors.foreground }}
                      className='font-semibold text-sm'
                    >
                      {getInitials(org.name)}
                    </Text>
                  )}
                </View>
              ))}
              {extraOrgsCount > 0 && (
                <View
                  style={{ 
                    backgroundColor: colors.muted,
                    marginLeft: -12,
                    zIndex: 0,
                    borderWidth: 2,
                    borderColor: colors.background,
                  }}
                  className='w-10 h-10 rounded-full justify-center items-center'
                >
                  <Text
                    style={{ color: colors.foreground }}
                    className='font-semibold text-xs'
                  >
                    +{extraOrgsCount}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable 
              onPress={() => hasCoHosts && setShowOrgsModal(true)}
              className='flex-1'
            >
              <Text
                style={{ 
                  color: hasCoHosts ? colors.foreground + 'CC' : colors.foreground 
                }}
                className={hasCoHosts ? 'font-medium text-sm leading-4' : 'font-semibold text-base leading-5'}
                numberOfLines={2}
              >
                {organizationNamesDisplay}
              </Text>
              <Text
                style={{ color: colors.mutedForeground }}
                className='text-xs leading-4 mt-[1px]'
              >
                {event.category.name}
              </Text>
            </Pressable>
            <View className='flex-row gap-2'>
              {/* NOW/TODAY/NEW badges (priority: NOW > TODAY > NEW) */}
              {isNow ? (
                <View
                  style={{
                    backgroundColor: colors.accent + '15',
                    borderColor: colors.accent + '30',
                  }}
                  className='px-2.5 py-1.5 rounded-xl border'
                >
                  <Text
                    style={{ color: colors.accent }}
                    className='text-xs font-semibold tracking-[0.5px]'
                  >
                    {t('nowTag')}
                  </Text>
                </View>
              ) : isTodayOnly ? (
                <View
                  style={{
                    backgroundColor: colors.accent + '15',
                    borderColor: colors.accent + '30',
                  }}
                  className='px-2.5 py-1.5 rounded-xl border'
                >
                  <Text
                    style={{ color: colors.accent }}
                    className='text-xs font-semibold tracking-[0.5px]'
                  >
                    {t('todayTag')}
                  </Text>
                </View>
              ) : event.is_new ? (
                <View
                  style={{
                    backgroundColor: colors.accent + '15',
                    borderColor: colors.accent + '30',
                  }}
                  className='px-2.5 py-1.5 rounded-xl border'
                >
                  <Text
                    style={{ color: colors.accent }}
                    className='text-xs font-semibold tracking-[0.5px]'
                  >
                    {t('newTag')}
                  </Text>
                </View>
              ) : null}

              {event.participation_status ? (
                <View
                  style={{
                    backgroundColor: '#10B981' + '15',
                    borderColor: '#10B981' + '30',
                  }}
                  className='w-8 h-8 rounded-full border items-center justify-center'
                >
                  <Feather name='check-circle' size={16} color='#10B981' />
                </View>
              ) : null}

              {/* Unverified badge for staff users */}
              {isStaff && event.verified === false && (
                <View
                  style={{
                    backgroundColor: '#F59E0B' + '15',
                    borderColor: '#F59E0B' + '30',
                  }}
                  className='px-2.5 py-1.5 rounded-xl border'
                >
                  <Text
                    style={{ color: '#F59E0B' }}
                    className='text-xs font-semibold tracking-[0.5px]'
                  >
                    {t('unverifiedTag')}
                  </Text>
                </View>
              )}

              {/* Verified but unpublished badge for staff users */}
              {isStaff && event.verified === true && event.is_published === false && (
                <View
                  style={{
                    backgroundColor: '#8B5CF6' + '15',
                    borderColor: '#8B5CF6' + '30',
                  }}
                  className='px-2.5 py-1.5 rounded-xl border'
                >
                  <Text
                    style={{ color: '#8B5CF6' }}
                    className='text-xs font-semibold tracking-[0.5px]'
                  >
                    {t('unpublishedTag')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Image */}
        <View>
          <View
            style={{
              backgroundColor: colors.muted,
              aspectRatio: imageAspectRatio,
            }}
            className='w-full overflow-hidden'
          >
            {event.image_url ? (
              <CachedImage
                source={{ uri: event.image_url }}
                style={{ width: '100%', height: '100%' }}
                contentFit='cover'
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
              />
            ) : (
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#EAEAEA',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Feather name='image' size={48} color='#C9C9C9' />
              </View>
            )}
          </View>
        </View>

        {/* Content (configurable navigation) */}
        <Pressable onPress={handleEventLinkPress} className='px-3 pt-4 pb-5'>
          {/* Title and Share */}
          <View className='flex-row items-start'>
            <View className='flex-1 mr-3'>
              <Text
                style={{ color: colors.foreground }}
                className='font-semibold text-2xl leading-7 mb-2'
                numberOfLines={3}
              >
                {event.title}
              </Text>
            </View>
            <ShareButton
              event={event}
              size={22}
              className='mr-1'
              stopPropagationOnPress
            />
            <LikeButton
              isLiked={event.liked || false}
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
              <View
                style={{
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                }}
                className='flex-row items-center py-1.5 px-2.5 rounded-full border'
              >
                <Feather name='calendar' size={12} color={iconPrimary} />
                <Text
                  style={{ color: colors.foreground }}
                  className='text-xs font-medium ml-1.5'
                >
                  {formatDateRangeShort(event.starts_at, event.ends_at)}
                </Text>
              </View>

              {/* Time chip */}
              <View
                style={{
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                }}
                className='flex-row items-center py-1.5 px-2.5 rounded-full border'
              >
                <Feather name='clock' size={12} color={iconPrimary} />
                <Text
                  style={{ color: colors.foreground }}
                  className='text-xs font-medium ml-1.5'
                >
                  {formatTimeRangeShort(event.starts_at, event.ends_at)}
                </Text>
              </View>
            </View>

            {/* Location chip on its own row */}
            {event.location ? (
              <View
                style={{
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                }}
                className='self-start flex-row items-center py-1.5 px-2.5 rounded-full border max-w-full'
              >
                <Feather name='map-pin' size={12} color={iconPrimary} />
                <View className='flex-1 flex-shrink'>
                  <Text
                    style={{ color: colors.foreground }}
                    className='text-xs font-medium ml-1.5'
                    numberOfLines={1}
                  >
                    {event.location}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Description (truncated, no expand in this redesign) */}
          {event.description ? (
            <View className='mb-2'>
              <Text
                style={{ color: colors.foreground }}
                className='text-base leading-6 font-sans'
              >
                {`${event.description.slice(0, 150)}${
                  event.description.length > 150 ? '...' : ''
                }`}
              </Text>
            </View>
          ) : null}

          {/* Friends Interested */}
          {event.friends_interested && event.friends_interested.count > 0 && (
            <FriendsAttending
              friends={event.friends_interested.friends}
              count={event.friends_interested.count}
              onPress={
                event.friends_interested.count > 3
                  ? () => setShowFriendsModal(true)
                  : undefined
              }
            />
          )}

          <SignInRequiredModal
            visible={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSignIn={() => {
              setShowAuthModal(false);
              router.push('/signin' as any);
            }}
          />

          <FirstLikeModal
            visible={showFirstLikeModal}
            onClose={() => setShowFirstLikeModal(false)}
            eventTitle={event.title}
          />

          <FriendsInterestedModal
            visible={showFriendsModal}
            onClose={() => setShowFriendsModal(false)}
            friends={event.friends_interested?.friends ?? []}
            count={event.friends_interested?.count ?? 0}
          />

          <OrganizationListModal
            visible={showOrgsModal}
            onClose={() => setShowOrgsModal(false)}
            organizations={allOrganizations}
          />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}
