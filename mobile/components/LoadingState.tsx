import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

interface LoadingStateProps {
  size?: 'small' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = React.memo(
  ({ size = 'large' }) => {
    const { colors } = useThemeColors();

    return (
      <View className='flex-1 justify-center items-center'>
        <ActivityIndicator size={size} color={colors.foreground} />
      </View>
    );
  }
);

export default LoadingState;
