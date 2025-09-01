import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
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
import { OfflineIndicator } from '../../components/OfflineIndicator';
import ImageView from 'react-native-image-viewing';
import { useAnalytics } from '../../lib/analytics';
import { useAuth } from '../../contexts/AuthContext';
import { useEventData } from '../../hooks/useEventData';
import { useEventActions } from '../../hooks/useEventActions';
import { t } from '../../lib/i18n';

export default function EventDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = useMemo(() => colorScheme === 'dark', [colorScheme]);
  const iconPrimary = useMemo(() => (isDark ? '#FFFFFF' : '#000000'), [isDark]);
  const { eventSlug, postId } = useLocalSearchParams();
  const router = useRouter();
  const analytics = useAnalytics();
  const { isAuthenticated } = useAuth();

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
    postsError,
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

  // Error handling
  useEffect(() => {
    if (eventError) {
      Alert.alert(t('errorTitle'), t('failedToLoadEvent'), [
        { text: t('ok'), onPress: () => router.replace('/') },
      ]);
    }
  }, [eventError, router]);

  // Handle posts error separately - we can still show the event details
  if (postsError) {
    console.warn('Failed to load posts:', postsError);
    // Continue rendering the component - posts will show error state in the tab
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-white dark:bg-black'>
        <LoadingState />
      </SafeAreaView>
    );
  }

  // Error state
  if (eventError || !event) {
    return (
      <SafeAreaView className='flex-1 bg-white dark:bg-black'>
        <ErrorState
          title={t('failedToLoadEvent')}
          message={t('tryAgainLater')}
        />
      </SafeAreaView>
    );
  }

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

      {/* Event Header */}
      <EventHeader
        title={event.title}
        isLiked={!!event.liked}
        onLikePress={handleHeartPress}
        isAuthenticated={isAuthenticated}
        iconPrimary={iconPrimary}
      />

      {/* Offline indicator */}
      <View className='px-4 py-2'>
        <OfflineIndicator className='bg-gray-50 dark:bg-gray-900' />
      </View>

      {/* Event Tabs */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(200)}
        className='flex-1'
      >
        <SimpleEventTabs
          eventSlug={eventSlug as string}
          posts={posts}
          isLoadingPosts={false} // We handle loading at the top level
          postsError={postsError}
          eventDays={eventDays}
          itemsByDay={scheduleByDay}
          onMapPress={handleMapPress}
          onExternalLink={handleExternalLinkWithAnimation}
          onImagePress={handleImagePress}
          ctaAnimatedStyle={ctaAnimatedStyle}
        />
      </Animated.View>
    </SafeAreaView>
  );
}
