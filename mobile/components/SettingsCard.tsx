import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
  const { colors } = useTheme();

  const handlePress = async () => {
    if (onPress) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const cardContent = (
    <View className='flex-row items-center' style={{ opacity: disabled ? 0.5 : 1 }}>
      {/* Icon */}
      <View
        style={{ backgroundColor: colors.muted }}
        className='w-10 h-10 rounded-full justify-center items-center mr-3'
      >
        <Feather name={icon} size={20} color={colors.foreground} />
      </View>

      {/* Content */}
      <View className='flex-1'>
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
      <View className='ml-3'>
        {rightElement ||
          (showChevron && (
            <Feather name='chevron-right' size={20} color={colors.foreground} />
          ))}
      </View>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
        className='border rounded-[14px] p-4 mb-3 active:opacity-80'
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
      className='border rounded-[14px] p-4 mb-3'
    >
      {cardContent}
    </View>
  );
}
