import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

interface GlassChipProps {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export default function GlassChip({
  label,
  icon,
  onPress,
  variant = 'default',
  size = 'medium',
  disabled = false,
}: GlassChipProps) {
  const { isDark, colors } = useTheme();

  const handlePress = async () => {
    if (onPress && !disabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  // Size configurations
  const sizeConfig = {
    small: { paddingH: 8, paddingV: 4, fontSize: 11, iconSize: 10, borderRadius: 10 },
    medium: { paddingH: 12, paddingV: 6, fontSize: 12, iconSize: 12, borderRadius: 12 },
    large: { paddingH: 16, paddingV: 8, fontSize: 14, iconSize: 14, borderRadius: 14 },
  };

  // Variant colors
  const variantColors = {
    default: {
      bg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      border: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      text: colors.foreground,
      icon: colors.foreground,
    },
    accent: {
      bg: isDark ? 'rgba(236, 46, 129, 0.15)' : 'rgba(236, 46, 129, 0.1)',
      border: isDark ? 'rgba(236, 46, 129, 0.3)' : 'rgba(236, 46, 129, 0.25)',
      text: colors.accent,
      icon: colors.accent,
    },
    success: {
      bg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
      border: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
      text: '#10B981',
      icon: '#10B981',
    },
    warning: {
      bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
      border: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.25)',
      text: '#F59E0B',
      icon: '#F59E0B',
    },
    info: {
      bg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
      border: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)',
      text: '#3B82F6',
      icon: '#3B82F6',
    },
  };

  const currentSize = sizeConfig[size];
  const currentColors = variantColors[variant];

  const chipContent = (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: currentSize.paddingH,
          paddingVertical: currentSize.paddingV,
          borderRadius: currentSize.borderRadius,
        },
      ]}
    >
      {/* Blur background */}
      <BlurView
        intensity={isDark ? 20 : 30}
        tint={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: currentSize.borderRadius, overflow: 'hidden' }]}
      />

      {/* Background tint */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: currentColors.bg,
            borderRadius: currentSize.borderRadius,
          },
        ]}
      />

      {/* Top highlight for glass effect */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255, 255, 255, 0.08)', 'transparent']
            : ['rgba(255, 255, 255, 0.6)', 'transparent']
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: currentSize.borderRadius }]}
      />

      {/* Border */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: currentSize.borderRadius,
            borderWidth: isDark ? 0.5 : 1,
            borderColor: currentColors.border,
          },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        {icon && (
          <Feather
            name={icon}
            size={currentSize.iconSize}
            color={currentColors.icon}
            style={{ marginRight: 6 }}
          />
        )}
        <Text
          style={[
            styles.label,
            {
              fontSize: currentSize.fontSize,
              color: currentColors.text,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        {chipContent}
      </TouchableOpacity>
    );
  }

  return chipContent;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  label: {
    fontWeight: '500',
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    position: 'relative',
    zIndex: 1,
  },
});

// Badge variant for status indicators
interface GlassBadgeProps {
  label: string;
  variant?: 'accent' | 'success' | 'warning' | 'info' | 'default';
}

export function GlassBadge({ label, variant = 'accent' }: GlassBadgeProps) {
  const { isDark, colors } = useTheme();

  const variantColors = {
    default: {
      bg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      border: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      text: colors.foreground,
    },
    accent: {
      bg: isDark ? 'rgba(236, 46, 129, 0.2)' : 'rgba(236, 46, 129, 0.12)',
      border: isDark ? 'rgba(236, 46, 129, 0.35)' : 'rgba(236, 46, 129, 0.3)',
      text: colors.accent,
    },
    success: {
      bg: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)',
      border: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.3)',
      text: '#10B981',
    },
    warning: {
      bg: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.12)',
      border: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.3)',
      text: '#F59E0B',
    },
    info: {
      bg: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.12)',
      border: isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(139, 92, 246, 0.3)',
      text: '#8B5CF6',
    },
  };

  const currentColors = variantColors[variant];

  return (
    <View style={styles.badgeContainer}>
      {/* Blur background */}
      <BlurView
        intensity={isDark ? 15 : 25}
        tint={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: 14, overflow: 'hidden' }]}
      />

      {/* Background tint */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: currentColors.bg,
            borderRadius: 14,
          },
        ]}
      />

      {/* Border */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: 14,
            borderWidth: isDark ? 0.5 : 1,
            borderColor: currentColors.border,
          },
        ]}
      />

      <Text
        style={[
          styles.badgeText,
          { color: currentColors.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
