import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Feather.glyphMap;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function GlassButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
}: GlassButtonProps) {
  const { isDark, colors } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Size configurations
  const sizeConfig = {
    small: { paddingH: 16, paddingV: 10, fontSize: 14, iconSize: 16, borderRadius: 14 },
    medium: { paddingH: 24, paddingV: 14, fontSize: 16, iconSize: 18, borderRadius: 18 },
    large: { paddingH: 32, paddingV: 18, fontSize: 18, iconSize: 20, borderRadius: 22 },
  };

  // Variant configurations
  const getVariantConfig = () => {
    switch (variant) {
      case 'primary':
        return {
          gradientColors: ['#2066DF', '#1a56c4'] as const,
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
          useGradient: true,
          glassBg: '',
          glassBorder: '',
          shadowColor: '#2066DF',
          shadowOpacity: 0.35,
        };
      case 'secondary':
        return {
          gradientColors: [] as const,
          textColor: colors.foreground,
          iconColor: colors.foreground,
          useGradient: false,
          glassBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          glassBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
          shadowColor: '#000000',
          shadowOpacity: isDark ? 0.3 : 0.1,
        };
      case 'ghost':
        return {
          gradientColors: [] as const,
          textColor: colors.foreground,
          iconColor: colors.foreground,
          useGradient: false,
          glassBg: 'transparent',
          glassBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          shadowColor: 'transparent',
          shadowOpacity: 0,
        };
      case 'destructive':
        return {
          gradientColors: ['#EF4444', '#dc2626'] as const,
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
          useGradient: true,
          glassBg: '',
          glassBorder: '',
          shadowColor: '#EF4444',
          shadowOpacity: 0.35,
        };
      default:
        return {
          gradientColors: ['#2066DF', '#1a56c4'] as const,
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
          useGradient: true,
          glassBg: '',
          glassBorder: '',
          shadowColor: '#2066DF',
          shadowOpacity: 0.35,
        };
    }
  };

  const currentSize = sizeConfig[size];
  const variantConfig = getVariantConfig();

  const isDisabled = disabled || loading;
  const opacity = isDisabled ? 0.5 : 1;

  const renderContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator size="small" color={variantConfig.textColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Feather
              name={icon}
              size={currentSize.iconSize}
              color={variantConfig.iconColor}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={[
              styles.text,
              {
                fontSize: currentSize.fontSize,
                color: variantConfig.textColor,
              },
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Feather
              name={icon}
              size={currentSize.iconSize}
              color={variantConfig.iconColor}
              style={{ marginLeft: 8 }}
            />
          )}
        </>
      )}
    </View>
  );

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        animatedStyle,
        styles.container,
        {
          borderRadius: currentSize.borderRadius,
          opacity,
          shadowColor: variantConfig.shadowColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: variantConfig.shadowOpacity,
          shadowRadius: 12,
          elevation: variantConfig.shadowOpacity > 0 ? 8 : 0,
        },
        fullWidth && styles.fullWidth,
      ]}
    >
      {variantConfig.useGradient ? (
        // Gradient button (primary, destructive)
        <View
          style={[
            styles.buttonInner,
            {
              paddingHorizontal: currentSize.paddingH,
              paddingVertical: currentSize.paddingV,
              borderRadius: currentSize.borderRadius,
            },
          ]}
        >
            <LinearGradient
              colors={variantConfig.gradientColors as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: currentSize.borderRadius }]}
            />
          {/* Top highlight */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.25)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={[StyleSheet.absoluteFill, { borderRadius: currentSize.borderRadius }]}
          />
          {renderContent()}
        </View>
      ) : (
        // Glass button (secondary, ghost)
        <View
          style={[
            styles.buttonInner,
            {
              paddingHorizontal: currentSize.paddingH,
              paddingVertical: currentSize.paddingV,
              borderRadius: currentSize.borderRadius,
            },
          ]}
        >
          {/* Blur background */}
          {variant !== 'ghost' && (
            <BlurView
              intensity={isDark ? 25 : 35}
              tint={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: currentSize.borderRadius, overflow: 'hidden' }]}
            />
          )}

          {/* Background tint */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: variantConfig.glassBg,
                borderRadius: currentSize.borderRadius,
              },
            ]}
          />

          {/* Top highlight */}
          {variant !== 'ghost' && (
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(255, 255, 255, 0.1)', 'transparent']
                  : ['rgba(255, 255, 255, 0.6)', 'transparent']
              }
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.5 }}
              style={[StyleSheet.absoluteFill, { borderRadius: currentSize.borderRadius }]}
            />
          )}

          {/* Border */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: currentSize.borderRadius,
                borderWidth: isDark ? 0.5 : 1,
                borderColor: variantConfig.glassBorder,
              },
            ]}
          />

          {renderContent()}
        </View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  buttonInner: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  text: {
    fontWeight: '600',
  },
});
