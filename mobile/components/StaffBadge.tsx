import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';

interface StaffBadgeProps {
  count: number;
}

export default function StaffBadge({ count }: StaffBadgeProps) {
  const { colors } = useThemeColors();

  return (
    <View
      style={{ backgroundColor: colors.muted }}
      className="flex-row items-center px-2 py-1 rounded-full"
    >
      <Feather 
        name="heart" 
        size={12} 
        color={colors.mutedForeground} 
        style={{ marginRight: 4 }}
      />
      <Text
        style={{ color: colors.mutedForeground }}
        className="text-xs font-medium"
      >
        {count}
      </Text>
    </View>
  );
}
