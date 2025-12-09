import React from 'react';
import { TouchableOpacity, Share, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAnalytics } from '../lib/analytics';
import { config } from '../lib/config';
import { t } from '../lib/i18n';
import { Event } from '../types';

interface ShareButtonProps {
  event: Pick<Event, 'slug' | 'title' | 'id' | 'starts_at' | 'ends_at' | 'image_url' | 'aspect_ratio' | 'is_new'> & {
    category: { slug: string; name: string };
    organization: { id?: string | null; name: string };
  };
  size?: number;
  className?: string;
  stopPropagationOnPress?: boolean;
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export default function ShareButton({
  event,
  size = 24,
  className = '',
  stopPropagationOnPress = false,
}: ShareButtonProps) {
  const { colors } = useThemeColors();
  const analytics = useAnalytics();

  const buttonScale = useSharedValue(1);

  const handlePress = async (e?: any) => {
    if (stopPropagationOnPress) {
      e?.stopPropagation?.();
    }

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate button
    buttonScale.value = withSequence(
      withSpring(0.85, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    // Track share event
    analytics.trackEventShareClicked(event);

    // Build share URL
    const shareUrl = `${config.shareBaseUrl}/${event.slug}`;

    try {
      await Share.share({
        message: shareUrl,
        // url: shareUrl, // iOS only
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View className={`p-2 ${className}`}>
      <AnimatedTouchableOpacity
        onPress={handlePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
        style={animatedStyle}
        accessibilityLabel={t('shareEvent')}
        accessibilityRole="button"
      >
        <Feather name="share-2" size={size} color={colors.foreground} />
      </AnimatedTouchableOpacity>
    </View>
  );
}

