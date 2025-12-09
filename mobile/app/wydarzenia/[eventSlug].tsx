import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { generateEventDays } from '../../components/WeekDaySelector';
import { View, Alert, Platform, ToastAndroid } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { EventHeader } from '../../components/EventHeader';
import { SimpleEventTabs } from '../../components/SimpleEventTabs';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import SignInRequiredModal from '../../components/SignInRequiredModal';
import FirstLikeModal from '../../components/FirstLikeModal';
import ImageView from 'react-native-image-viewing';
import { useAnalytics } from '../../lib/analytics';
import { useAuth } from '../../contexts/AuthContext';
import { useEventBySlug } from '../../lib/queries';
import { useEventActions } from '../../hooks/useEventActions';
import { useVerifyEvent } from '../../lib/queries';
import { t } from '../../lib/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { CATEGORY_SLUGS } from '../../lib/constants';
import VerifyEventModal from '../../components/VerifyEventModal';

export default function EventDetailScreen() {
  const { colors } = useThemeColors();
  const iconPrimary = colors.foreground;
  const { eventSlug, postId } = useLocalSearchParams();
  const router = useRouter();
  const analytics = useAnalytics();
  const { isAuthenticated, isStaff } = useAuth();
  const insets = useSafeAreaInsets();

  // State hooks
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<{ uri: string }[]>(
    []
  );
  const [imageViewerInitialIndex, setImageViewerInitialIndex] = useState(0);

  // Animation values
  const ctaScale = useSharedValue(1);

  // Ensure eventSlug is always a string or undefined consistently
  const eventSlugString = typeof eventSlug === 'string' ? eventSlug : undefined;

  // Direct React Query usage
  const {
    data: event,
    isLoading,
    error: eventError,
    refetch: refetchEvent,
  } = useEventBySlug(eventSlugString);

  // Extract posts and schedule from event data
  const posts = event?.posts || [];
  const schedule = event?.schedule;

  // Generate event days from event dates
  const eventDays = useMemo(() => {
    return event ? generateEventDays(event.starts_at, event.ends_at) : [];
  }, [event?.starts_at, event?.ends_at]);

  // Check if schedule has any items
  const hasSchedule = useMemo(() => {
    return schedule && schedule.items && schedule.items.length > 0;
  }, [schedule]);

  // Group schedule items by day id
  const scheduleByDay = useMemo(() => {
    const grouped: Record<
      string,
      Array<{
        id: string;
        time: string;
        title: string;
        description: string | null;
        duration: string;
        endTime: string;
      }>
    > = {};

    if (!schedule || !schedule.items) return grouped;

    for (const item of schedule.items) {
      const dayId = item.date; // YYYY-MM-DD
      const time = item.start_time.slice(0, 5); // HH:MM
      const endTime = item.end_time.slice(0, 5); // HH:MM

      if (!grouped[dayId]) grouped[dayId] = [];
      grouped[dayId].push({
        id: item.id,
        time,
        title: item.title,
        description: item.description,
        duration: item.duration,
        endTime,
      });
    }

    // Sort each day's items by start time
    for (const day of Object.keys(grouped)) {
      grouped[day].sort((a, b) =>
        a.time < b.time ? -1 : a.time > b.time ? 1 : 0
      );
    }

    return grouped;
  }, [schedule]);

  const {
    handleHeartPress,
    handleMapPress,
    handleExternalLink,
    showFirstLikeModal,
    setShowFirstLikeModal,
  } = useEventActions(event, setShowAuthModal);

  // Verify event mutation
  const verifyEventMutation = useVerifyEvent();

  const handleVerifyEvent = async () => {
    if (!event) return;
    try {
      await verifyEventMutation.mutateAsync(event.slug);
      // Success feedback could be added here
    } catch (error) {
      console.error('Failed to verify event:', error);
    }
  };

  // CTA animated style
  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  // Enhanced external link handler with animation
  const handleExternalLinkWithAnimation = useCallback(async () => {
    try {
      ctaScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      await handleExternalLink(ctaScale);
      ctaScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    } catch (error) {
      ctaScale.value = withSpring(1, { damping: 12, stiffness: 200 });
      console.error('Error opening external link:', error);
    }
  }, [ctaScale, handleExternalLink]);

  // Image viewer handler
  const handleImagePress = useCallback(
    async (images: string[], initialIndex: number) => {
      const formattedImages = images.map((uri) => ({ uri }));
      setImageViewerImages(formattedImages);
      setImageViewerInitialIndex(initialIndex);
      setImageViewerVisible(true);
    },
    []
  );

  // Ensure a back target exists when opening this screen from a universal link
  useEffect(() => {
    if (!router.canGoBack() && eventSlugString) {
      const eventPath = `/wydarzenia/${eventSlugString}`;
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

  // Analytics tracking
  useEffect(() => {
    if (event) {
      analytics.trackEventDetailViewed(event as any, 'navigation');
    }
  }, [event, analytics]);

  // Error handling: navigate back and show quick message
  useEffect(() => {
    console.log('eventError', eventError);
    if (eventError && !isLoading && !event) {
      // Navigate back to main immediately
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }

      // Show short auto-dismissing message
      const message = t('failedToLoadEvent');
      if (Platform.OS === 'android') {
        try {
          ToastAndroid.show(message, ToastAndroid.SHORT);
        } catch {}
      } else {
        // Fallback for iOS: simple alert (requires dismissal)
        Alert.alert(t('errorTitle'), message);
      }
    }
  }, [eventError, isLoading, event, router]);

  // Posts are now included in the main event query, so no separate error handling needed

  // Loading state
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <LoadingState />
      </View>
    );
  }

  // Error state handled via navigation + toast above
  if (eventError || !event) {
    return null;
  }

  const isRecruitmentCategory = event.category?.slug === CATEGORY_SLUGS.REKRUTACJA;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
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

      <VerifyEventModal
        visible={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onVerify={handleVerifyEvent}
        eventTitle={event.title}
        publicationDate={event.publication_date}
      />

      <ImageView
        images={imageViewerImages}
        imageIndex={imageViewerInitialIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />

      {/* Event Header */}
      <EventHeader
        title={event.title}
        isLiked={!!event.liked}
        onLikePress={handleHeartPress}
        isAuthenticated={isAuthenticated}
        iconPrimary={iconPrimary}
        event={event}
      />

      <Animated.View
        entering={FadeInDown.duration(400).delay(200)}
        className='flex-1'
      >
        <SimpleEventTabs
          eventSlug={eventSlug as string}
          posts={posts}
          eventDays={eventDays}
          itemsByDay={scheduleByDay}
          hasSchedule={hasSchedule || false}
          onMapPress={handleMapPress}
          onExternalLink={handleExternalLinkWithAnimation}
          onImagePress={handleImagePress}
          ctaAnimatedStyle={ctaAnimatedStyle}
          isStaff={isStaff}
          onVerify={() => setShowVerifyModal(true)}
          isRecruitmentCategory={isRecruitmentCategory}
        />
      </Animated.View>
    </View>
  );
}
