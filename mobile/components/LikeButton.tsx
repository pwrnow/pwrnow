import React from 'react';
import { TouchableOpacity, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface LikeButtonProps {
  isLiked: boolean;
  onPress: () => void;
  size?: number;
  className?: string;
  stopPropagationOnPress?: boolean;
}

export default function LikeButton({
  isLiked,
  onPress,
  size = 18,
  className = '',
  stopPropagationOnPress = false,
}: LikeButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handlePress = async (e?: any) => {
    if (stopPropagationOnPress) {
      // @ts-ignorepacing it
      e?.stopPropagation?.();
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
      className={`p-2 ${className}`}
    >
      <Feather name='heart' size={size} color={'#EC2E81'} />
    </TouchableOpacity>
  );
}
