import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

interface GlassHeaderProps {
  children: React.ReactNode;
  showBorder?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
}

export default function GlassHeader({
  children,
  showBorder = true,
  intensity = 'medium',
}: GlassHeaderProps) {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const blurIntensity = {
    light: isDark ? 30 : 40,
    medium: isDark ? 50 : 60,
    heavy: isDark ? 70 : 80,
  };

  const glassBg = isDark
    ? 'rgba(0, 0, 0, 0.7)'
    : 'rgba(255, 255, 255, 0.8)';

  const glassBorder = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.05)';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Blur background */}
      <BlurView
        intensity={blurIntensity[intensity]}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* Glass tint */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: glassBg },
        ]}
      />

      {/* Top gradient highlight */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255, 255, 255, 0.06)', 'transparent']
            : ['rgba(255, 255, 255, 0.7)', 'transparent']
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Bottom border */}
      {showBorder && (
        <View
          style={[
            styles.border,
            { backgroundColor: glassBorder },
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
    position: 'relative',
    zIndex: 100,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  border: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});

// Floating glass header variant for overlays
interface FloatingGlassHeaderProps {
  children: React.ReactNode;
  style?: any;
}

export function FloatingGlassHeader({ children, style }: FloatingGlassHeaderProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const glassBg = isDark
    ? 'rgba(20, 20, 20, 0.8)'
    : 'rgba(255, 255, 255, 0.85)';

  const glassBorder = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.06)';

  return (
    <View
      style={[
        floatingStyles.container,
        {
          marginTop: insets.top + 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.4 : 0.12,
          shadowRadius: 20,
          elevation: 12,
        },
        style,
      ]}
    >
      {/* Blur background */}
      <BlurView
        intensity={isDark ? 50 : 70}
        tint={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: 20, overflow: 'hidden' }]}
      />

      {/* Glass tint */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: glassBg, borderRadius: 20 },
        ]}
      />

      {/* Gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.04)']
            : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.7)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
      />

      {/* Top highlight */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255, 255, 255, 0.1)', 'transparent']
            : ['rgba(255, 255, 255, 0.8)', 'transparent']
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
      />

      {/* Border */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: 20,
            borderWidth: isDark ? 0.5 : 1,
            borderColor: glassBorder,
          },
        ]}
      />

      {/* Content */}
      <View style={floatingStyles.content}>{children}</View>
    </View>
  );
}

const floatingStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    padding: 12,
  },
});
