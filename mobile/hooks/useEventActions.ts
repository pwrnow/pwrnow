import { useCallback, useState, useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useLikeEvent, useUnlikeEvent } from '../lib/queries';
import { useAnalytics } from '../lib/analytics';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../lib/i18n';
import {
  hasSeenFirstLikeModal,
  markFirstLikeModalAsSeen,
} from '../lib/firstLikeStorage';

export const useEventActions = (
  event: any,
  setShowAuthModal: (show: boolean) => void
) => {
  const router = useRouter();
  const analytics = useAnalytics();
  const { isAuthenticated } = useAuth();
  const [showFirstLikeModal, setShowFirstLikeModal] = useState(false);

  // React Query mutations for like/unlike
  const likeMutation = useLikeEvent();
  const unlikeMutation = useUnlikeEvent();

  const handleHeartPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!event) return;

    const nextLiked = !event.liked;
    analytics.trackEventFavoriteToggled(event, nextLiked);

    if (nextLiked) {
      likeMutation.mutate(event.slug);

      // Check if this is the first like and show modal
      const hasSeenModal = await hasSeenFirstLikeModal();
      if (!hasSeenModal) {
        setShowFirstLikeModal(true);
        await markFirstLikeModalAsSeen();
      }
    } else {
      unlikeMutation.mutate(event.slug);
    }
    event.liked = !event.liked;
  }, [
    isAuthenticated,
    event?.slug,
    event?.liked,
    analytics,
    likeMutation,
    unlikeMutation,
    setShowAuthModal,
  ]);

  const handleMapPress = useCallback(async () => {
    if (!event || !event.location) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // On Android, directly open Google Maps without showing alert
    if (Platform.OS === 'android') {
      try {
        const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
          event.location || ''
        )}`;
        const canOpen = await Linking.canOpenURL(googleMapsUrl);
        if (canOpen) {
          await Linking.openURL(googleMapsUrl);
        } else {
          // Fallback to web version
          await Linking.openURL(googleMapsUrl);
        }
      } catch (error) {
        console.error('Error opening Google Maps:', error);
        Alert.alert(t('error'), t('failedToOpenMaps'));
      }
      return;
    }

    // On iOS, show the selection alert
    Alert.alert(
      t('openLocation'),
      t('chooseMapApp'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: 'Google Maps',
          onPress: async () => {
            try {
              const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
                event.location || ''
              )}`;
              const canOpen = await Linking.canOpenURL(googleMapsUrl);
              if (canOpen) {
                await Linking.openURL(googleMapsUrl);
              } else {
                // Fallback to web version
                await Linking.openURL(googleMapsUrl);
              }
            } catch (error) {
              console.error('Error opening Google Maps:', error);
              Alert.alert(t('error'), t('failedToOpenMaps'));
            }
          },
        },
        {
          text: 'Apple Maps',
          onPress: async () => {
            try {
              const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(
                event.location || ''
              )}`;
              await Linking.openURL(appleMapsUrl);
            } catch (error) {
              console.error('Error opening Apple Maps:', error);
              Alert.alert(t('error'), t('failedToOpenMaps'));
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [event?.location, t]);

  const handleExternalLink = useCallback(
    async (ctaScale: any) => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (event?.url) {
          await Linking.openURL(event.url);
        }
      } catch (error) {
        console.error('Error opening external link:', error);
      }
    },
    [event?.url]
  );

  return {
    handleHeartPress,
    handleMapPress,
    handleExternalLink,
    showFirstLikeModal,
    setShowFirstLikeModal,
  };
};
