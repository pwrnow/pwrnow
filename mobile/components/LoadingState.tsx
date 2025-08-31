import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';

interface LoadingStateProps {
  size?: 'small' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = React.memo(
  ({ size = 'large' }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
      <View className='flex-1 justify-center items-center'>
        <ActivityIndicator size={size} color={isDark ? '#FFFFFF' : '#000000'} />
      </View>
    );
  }
);

export default LoadingState;
