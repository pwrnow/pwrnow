import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  size: number;
}

function TabIcon({ name, focused, color, size }: TabIconProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(focused ? 1 : 0.6);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, {
      damping: 12,
      stiffness: 200,
    });
    opacity.value = withTiming(focused ? 1 : 0.6, { duration: 200 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

interface GlassTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  icons?: Record<string, keyof typeof Ionicons.glyphMap>;
}

export default function GlassTabBar({
  state,
  descriptors,
  navigation,
  icons = {},
}: GlassTabBarProps) {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Default icon mapping
  const defaultIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    index: 'home-outline',
    liked: 'heart-outline',
    friends: 'people-outline',
    admin: 'shield-outline',
    ...icons,
  };

  // Glass colors
  const glassBackground = isDark
    ? 'rgba(20, 20, 20, 0.75)'
    : 'rgba(255, 255, 255, 0.75)';

  const glassBorder = isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(0, 0, 0, 0.06)';

  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)';

  // Active indicator background
  const activeIndicatorColor = isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(0, 0, 0, 0.06)';

  const handleTabPress = async (route: any, isFocused: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const handleTabLongPress = async (route: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          marginHorizontal: 16,
          marginBottom: insets.bottom > 0 ? 0 : 16,
        },
      ]}
    >
      {/* Outer glow/shadow */}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.shadowContainer,
          {
            shadowColor: isDark ? '#000000' : '#000000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: isDark ? 0.5 : 0.15,
            shadowRadius: 28,
            elevation: 16,
          },
        ]}
      />

      {/* Glass container */}
      <View style={[styles.glassContainer, { borderRadius: 28 }]}>
        {/* Blur effect */}
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: 28, overflow: 'hidden' }]}
        />

        {/* Glass tint overlay */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: glassBackground,
              borderRadius: 28,
            },
          ]}
        />

        {/* Top highlight (specular) */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255, 255, 255, 0.12)', 'transparent']
              : ['rgba(255, 255, 255, 0.9)', 'transparent']
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
        />

        {/* Subtle gradient overlay */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.03)']
              : ['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.4)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
        />

        {/* Border */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 28,
              borderWidth: isDark ? 0.5 : 1,
              borderColor: glassBorder,
            },
          ]}
        />

        {/* Tab items */}
        <View style={styles.tabContainer}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            // Check if tab should be hidden
            if (options.href === null) {
              return null;
            }

            const iconName = defaultIcons[route.name] || 'ellipse-outline';

            return (
              <TabButton
                key={route.key}
                isFocused={isFocused}
                iconName={iconName}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
                activeIndicatorColor={activeIndicatorColor}
                isDark={isDark}
                onPress={() => handleTabPress(route, isFocused)}
                onLongPress={() => handleTabLongPress(route)}
                accessibilityLabel={options.tabBarAccessibilityLabel}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

interface TabButtonProps {
  isFocused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  activeColor: string;
  inactiveColor: string;
  activeIndicatorColor: string;
  isDark: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
}

function TabButton({
  isFocused,
  iconName,
  activeColor,
  inactiveColor,
  activeIndicatorColor,
  isDark,
  onPress,
  onLongPress,
  accessibilityLabel,
}: TabButtonProps) {
  const indicatorScale = useSharedValue(isFocused ? 1 : 0);
  const indicatorOpacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    indicatorScale.value = withSpring(isFocused ? 1 : 0.8, {
      damping: 15,
      stiffness: 200,
    });
    indicatorOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: indicatorScale.value }],
    opacity: indicatorOpacity.value,
  }));

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
      activeOpacity={0.7}
    >
      {/* Active indicator background */}
      <Animated.View
        style={[
          styles.activeIndicator,
          {
            backgroundColor: activeIndicatorColor,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          },
          indicatorStyle,
        ]}
      />
      
      <TabIcon
        name={isFocused ? (iconName.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : iconName}
        focused={isFocused}
        color={isFocused ? activeColor : inactiveColor}
        size={24}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  shadowContainer: {
    borderRadius: 28,
    backgroundColor: 'transparent',
  },
  glassContainer: {
    overflow: 'hidden',
    minHeight: 64,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 0.5,
  },
});
