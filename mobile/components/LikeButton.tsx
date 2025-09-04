import React, { useEffect } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeColors } from '../hooks/useThemeColors';

interface LikeButtonProps {
  isLiked: boolean;
  onPress: () => void;
  size?: number;
  className?: string;
  stopPropagationOnPress?: boolean;
  isAuthenticated?: boolean;
}

// Animated TouchableOpacity
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export default function LikeButton({
  isLiked,
  onPress,
  size = 30,
  className = '',
  stopPropagationOnPress = false,
  isAuthenticated = true,
}: LikeButtonProps) {
  const { colors } = useThemeColors();

  // Animation values
  const heartScale = useSharedValue(1);
  const heartRotation = useSharedValue(0);
  const burstScale = useSharedValue(0);
  const burstOpacity = useSharedValue(0);
  const shimmerProgress = useSharedValue(0);

  // Particle animations for the burst effect
  const particle1Scale = useSharedValue(0);
  const particle1Y = useSharedValue(0);
  const particle1Opacity = useSharedValue(0);
  const particle2Scale = useSharedValue(0);
  const particle2Y = useSharedValue(0);
  const particle2Opacity = useSharedValue(0);
  const particle3Scale = useSharedValue(0);
  const particle3Y = useSharedValue(0);
  const particle3Opacity = useSharedValue(0);

  // Enhanced haptic feedback sequence
  const triggerHaptics = async () => {
    if (isLiked) {
      // Unlike feedback - gentle
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Like feedback - emotionally engaging sequence
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 50);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 100);
    }
  };

  const handlePress = async (e?: any) => {
    if (stopPropagationOnPress) {
      e?.stopPropagation?.();
    }

    // Call the onPress function first to handle authentication check
    onPress();

    // Only trigger haptics and animations if user is authenticated
    if (!isAuthenticated) {
      return;
    }

    // Trigger haptics
    triggerHaptics();

    if (!isLiked) {
      // Liking animation - enthusiastic and joyful
      heartScale.value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 150 })
      );

      heartRotation.value = withSequence(
        withSpring(-10, { damping: 15, stiffness: 300 }),
        withSpring(10, { damping: 15, stiffness: 300 }),
        withSpring(0, { damping: 12, stiffness: 200 })
      );

      // Burst ring animation
      burstScale.value = 0;
      burstOpacity.value = 0.4;
      burstScale.value = withTiming(2, { duration: 400 });
      burstOpacity.value = withTiming(0, { duration: 400 });

      // Shimmer effect
      shimmerProgress.value = 0;
      shimmerProgress.value = withTiming(1, { duration: 600 });

      // Floating particles
      const animateParticles = () => {
        // Particle 1 - top right
        particle1Scale.value = withSequence(
          withDelay(50, withSpring(1, { damping: 8, stiffness: 200 })),
          withDelay(200, withSpring(0, { damping: 15, stiffness: 300 }))
        );
        particle1Y.value = withTiming(-30, { duration: 800 });
        particle1Opacity.value = withSequence(
          withDelay(50, withTiming(1, { duration: 100 })),
          withDelay(300, withTiming(0, { duration: 400 }))
        );

        // Particle 2 - top left
        particle2Scale.value = withSequence(
          withDelay(100, withSpring(1, { damping: 8, stiffness: 200 })),
          withDelay(250, withSpring(0, { damping: 15, stiffness: 300 }))
        );
        particle2Y.value = withTiming(-25, { duration: 700 });
        particle2Opacity.value = withSequence(
          withDelay(100, withTiming(1, { duration: 100 })),
          withDelay(250, withTiming(0, { duration: 450 }))
        );

        // Particle 3 - bottom right
        particle3Scale.value = withSequence(
          withDelay(150, withSpring(1, { damping: 8, stiffness: 200 })),
          withDelay(300, withSpring(0, { damping: 15, stiffness: 300 }))
        );
        particle3Y.value = withTiming(-20, { duration: 650 });
        particle3Opacity.value = withSequence(
          withDelay(150, withTiming(1, { duration: 100 })),
          withDelay(200, withTiming(0, { duration: 500 }))
        );
      };

      runOnJS(animateParticles)();
    } else {
      // Unliking animation - gentle and quick
      heartScale.value = withSequence(
        withSpring(0.8, { damping: 15, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
    }
  };

  // Reset particles when unliked
  useEffect(() => {
    if (!isLiked) {
      particle1Scale.value = 0;
      particle1Y.value = 0;
      particle1Opacity.value = 0;
      particle2Scale.value = 0;
      particle2Y.value = 0;
      particle2Opacity.value = 0;
      particle3Scale.value = 0;
      particle3Y.value = 0;
      particle3Opacity.value = 0;
    }
  }, [isLiked]);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: heartScale.value },
      { rotate: `${heartRotation.value}deg` },
    ],
  }));

  const burstAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: burstScale.value }],
    opacity: burstOpacity.value,
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmerProgress.value,
      [0, 0.5, 1],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
    };
  });

  const particle1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: particle1Scale.value },
      { translateY: particle1Y.value },
      { translateX: 15 },
    ],
    opacity: particle1Opacity.value,
  }));

  const particle2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: particle2Scale.value },
      { translateY: particle2Y.value },
      { translateX: -12 },
    ],
    opacity: particle2Opacity.value,
  }));

  const particle3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: particle3Scale.value },
      { translateY: particle3Y.value },
      { translateX: 8 },
    ],
    opacity: particle3Opacity.value,
  }));

  return (
    <View className={`p-2 ${className}`}>
      <AnimatedTouchableOpacity
        onPress={handlePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
        style={heartAnimatedStyle}
      >
        {/* Burst ring effect */}
        <Animated.View
          style={[
            burstAnimatedStyle,
            {
              position: 'absolute',
              top: -size / 2,
              left: -size / 2,
              width: size * 2,
              height: size * 2,
              borderRadius: size,
              borderWidth: 2,
              borderColor: colors.accent,
            },
          ]}
        />

        {/* Shimmer overlay */}
        {isLiked && (
          <Animated.View
            style={[
              shimmerAnimatedStyle,
              {
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                borderRadius: size / 2,
                backgroundColor: colors.accent,
              },
            ]}
          />
        )}

        {/* Main heart icon */}
        <AntDesign
          name={isLiked ? 'heart' : 'hearto'}
          size={size}
          color={colors.accent}
        />

        {/* Floating particles */}
        <Animated.View
          style={[
            particle1AnimatedStyle,
            {
              position: 'absolute',
              top: -5,
              left: size / 2,
            },
          ]}
        >
          <AntDesign name='heart' size={size / 3} color={colors.accent} />
        </Animated.View>

        <Animated.View
          style={[
            particle2AnimatedStyle,
            {
              position: 'absolute',
              top: -3,
              left: size / 3,
            },
          ]}
        >
          <AntDesign name='heart' size={size / 4} color={colors.accent} />
        </Animated.View>

        <Animated.View
          style={[
            particle3AnimatedStyle,
            {
              position: 'absolute',
              top: 2,
              left: size / 1.5,
            },
          ]}
        >
          <AntDesign name='heart' size={size / 5} color={colors.accent} />
        </Animated.View>
      </AnimatedTouchableOpacity>
    </View>
  );
}
