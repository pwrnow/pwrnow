import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import ImageView from 'react-native-image-viewing';
import { useAnalytics } from '../../lib/analytics';
import { useAuth } from '../../contexts/AuthContext';
import { useEventData } from '../../hooks/useEventData';
import { useEventActions } from '../../hooks/useEventActions';
import { t } from '../../lib/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function EventDetailScreen() {
  const { colors } = useThemeColors();
  const iconPrimary = colors.foreground;
  const { eventSlug, postId } = useLocalSearchParams();
  const router = useRouter();
  const analytics = useAnalytics();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  // State hooks
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<{ uri: string }[]>(
    []
  );
  const [imageViewerInitialIndex, setImageViewerInitialIndex] = useState(0);

  // Animation values
  const ctaScale = useSharedValue(1);

  // Ensure eventSlug is always a string or undefined consistently
  const eventSlugString = typeof eventSlug === 'string' ? eventSlug : undefined;

  // Custom hooks for data and actions
  const {
    event,
    posts,
    eventDays,
    scheduleByDay,
    isLoading,
    eventError,
    hasSchedule,
  } = useEventData(eventSlugString);

  const { handleHeartPress, handleMapPress, handleExternalLink } =
    useEventActions(event, setShowAuthModal);

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
    if (eventError) {
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
  }, [eventError, router]);

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
      />

      {/* Event Tabs */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(200)}
        className='flex-1'
      >
        <SimpleEventTabs
          eventSlug={eventSlug as string}
          posts={posts}
          isLoadingPosts={false} // We handle loading at the top level
          postsError={undefined} // No separate posts error since we use single query
          eventDays={eventDays}
          itemsByDay={scheduleByDay}
          hasSchedule={hasSchedule || false}
          onMapPress={handleMapPress}
          onExternalLink={handleExternalLinkWithAnimation}
          onImagePress={handleImagePress}
          ctaAnimatedStyle={ctaAnimatedStyle}
        />
      </Animated.View>
    </View>
  );
}
