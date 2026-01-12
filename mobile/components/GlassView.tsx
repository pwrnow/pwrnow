import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

interface GlassViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy' | 'ultra';
  variant?: 'default' | 'card' | 'floating' | 'pill' | 'modal';
  enableGlow?: boolean;
  glowColor?: string;
  borderRadius?: number;
  noBorder?: boolean;
  animated?: boolean;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function GlassView({
  children,
  style,
  className = '',
  intensity = 'medium',
  variant = 'default',
  enableGlow = false,
  glowColor,
  borderRadius,
  noBorder = false,
  animated = false,
}: GlassViewProps) {
  const { isDark, colors } = useTheme();

  // Animation for subtle shimmer effect
  const shimmerProgress = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      shimmerProgress.value = withRepeat(
        withTiming(1, { duration: 3000 }),
        -1,
        true
      );
    }
  }, [animated]);

  const shimmerStyle = useAnimatedStyle(() => {
    if (!animated) return {};
    const opacity = interpolate(
      shimmerProgress.value,
      [0, 0.5, 1],
      [0.3, 0.6, 0.3],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Blur intensity mapping
  const blurIntensityMap = {
    light: isDark ? 20 : 30,
    medium: isDark ? 40 : 50,
    heavy: isDark ? 60 : 70,
    ultra: isDark ? 80 : 90,
  };

  // Border radius mapping by variant
  const borderRadiusMap = {
    default: 16,
    card: 24,
    floating: 28,
    pill: 100,
    modal: 32,
  };

  const finalBorderRadius = borderRadius ?? borderRadiusMap[variant];
  const blurAmount = blurIntensityMap[intensity];

  // Glass tint colors
  const glassTint = isDark
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(255, 255, 255, 0.7)';

  const glassHighlight = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(255, 255, 255, 0.9)';

  const glassBorder = isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.6)';

  const glassShadow = isDark
    ? 'rgba(0, 0, 0, 0.5)'
    : 'rgba(0, 0, 0, 0.1)';

  // Gradient colors for the liquid glass effect
  const gradientColors = isDark
    ? [
        'rgba(255, 255, 255, 0.08)',
        'rgba(255, 255, 255, 0.02)',
        'rgba(255, 255, 255, 0.04)',
      ]
    : [
        'rgba(255, 255, 255, 0.95)',
        'rgba(255, 255, 255, 0.6)',
        'rgba(255, 255, 255, 0.8)',
      ];

  const defaultGlowColor = glowColor || (isDark ? colors.accent : colors.primary);

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: finalBorderRadius,
          shadowColor: glassShadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 24,
          elevation: 12,
        },
        style,
      ]}
      className={className}
    >
      {/* Glow effect layer */}
      {enableGlow && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: finalBorderRadius,
              backgroundColor: defaultGlowColor,
              opacity: isDark ? 0.15 : 0.1,
              transform: [{ scale: 1.02 }],
            },
          ]}
        />
      )}

      {/* Main blur layer */}
      <BlurView
        intensity={blurAmount}
        tint={isDark ? 'dark' : 'light'}
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: finalBorderRadius, overflow: 'hidden' },
        ]}
      />

      {/* Glass tint overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: glassTint,
            borderRadius: finalBorderRadius,
          },
        ]}
      />

      {/* Gradient highlight for liquid glass effect */}
      <AnimatedLinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: finalBorderRadius },
          animated ? shimmerStyle : {},
        ]}
      />

      {/* Top highlight edge (specular reflection) */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255, 255, 255, 0.15)', 'transparent']
            : ['rgba(255, 255, 255, 0.8)', 'transparent']
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: finalBorderRadius },
        ]}
      />

      {/* Border */}
      {!noBorder && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: finalBorderRadius,
              borderWidth: isDark ? 0.5 : 1,
              borderColor: glassBorder,
            },
          ]}
        />
      )}

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});

// Export preset configurations for common use cases
export const glassPresets = {
  card: {
    intensity: 'medium' as const,
    variant: 'card' as const,
  },
  tabBar: {
    intensity: 'heavy' as const,
    variant: 'floating' as const,
  },
  modal: {
    intensity: 'ultra' as const,
    variant: 'modal' as const,
  },
  pill: {
    intensity: 'light' as const,
    variant: 'pill' as const,
  },
  chip: {
    intensity: 'light' as const,
    variant: 'default' as const,
    borderRadius: 12,
  },
};
