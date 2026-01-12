import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsCardProps {
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  disabled?: boolean;
}

export default function SettingsCard({
  title,
  description,
  icon,
  onPress,
  rightElement,
  showChevron = true,
  disabled = false,
}: SettingsCardProps) {
  const { colors, isDark } = useTheme();

  const handlePress = async () => {
    if (onPress) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  // Glass colors
  const glassBg = isDark
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(255, 255, 255, 0.8)';
  
  const glassBorder = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.06)';

  const iconBg = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.05)';

  const cardContent = (
    <>
      {/* Blur background */}
      <BlurView
        intensity={isDark ? 30 : 50}
        tint={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, styles.blur]}
      />

      {/* Glass tint */}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.blur,
          { backgroundColor: glassBg },
        ]}
      />

      {/* Top highlight */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255, 255, 255, 0.08)', 'transparent']
            : ['rgba(255, 255, 255, 0.9)', 'transparent']
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={[StyleSheet.absoluteFill, styles.blur]}
      />

      {/* Border */}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.blur,
          {
            borderWidth: isDark ? 0.5 : 1,
            borderColor: glassBorder,
          },
        ]}
      />

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: iconBg },
          ]}
        >
          <Feather name={icon} size={20} color={colors.foreground} />
        </View>

        {/* Text content */}
        <View style={styles.textContainer}>
          <Text
            style={{ color: colors.foreground }}
            className='font-semibold text-base leading-5 mb-1'
          >
            {title}
          </Text>
          <Text
            style={{ color: colors.mutedForeground }}
            className='text-sm leading-4'
          >
            {description}
          </Text>
        </View>

        {/* Right element or chevron */}
        <View style={styles.rightElement}>
          {rightElement ||
            (showChevron && (
              <Feather name='chevron-right' size={20} color={colors.foreground} />
            ))}
        </View>
      </View>
    </>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.card,
          {
            shadowColor: isDark ? '#000000' : '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 12,
            elevation: 6,
          },
        ]}
        activeOpacity={0.8}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          shadowColor: isDark ? '#000000' : '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 12,
          elevation: 6,
        },
      ]}
    >
      {cardContent}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    minHeight: 72,
  },
  blur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
    zIndex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  rightElement: {
    marginLeft: 12,
  },
});
