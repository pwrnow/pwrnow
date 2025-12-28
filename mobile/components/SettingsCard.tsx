import React from 'react';
import { View, Text, Pressable } from 'react-native';
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
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const handlePress = async () => {
    if (onPress) {
      // Reset pressed state immediately before calling onPress
      // This ensures the card doesn't stay pressed when a popup opens
      setIsPressed(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const cardContent = (
    <View className='flex-row items-center'>
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
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          backgroundColor: colors.card,
          borderColor: isPressed ? colors.muted : colors.border,
          borderWidth: 1,
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
          opacity: isPressed ? 0.8 : 1,
        }}
      >
        {cardContent}
      </Pressable>
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
