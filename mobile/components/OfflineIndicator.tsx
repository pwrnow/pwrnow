import React from 'react';
import { View, Text } from 'react-native';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

interface OfflineIndicatorProps {
  showWhenOnline?: boolean;
  className?: string;
}

export function OfflineIndicator({
  showWhenOnline = false,
  className = '',
}: OfflineIndicatorProps) {
  const { isOffline, isOnline, networkType } = useOfflineStatus();

  // Don't show anything if we're online and not configured to show online status
  if (isOnline && !showWhenOnline) {
    return null;
  }

  // Don't show anything if we're offline and not configured to show offline status
  if (isOffline && !showWhenOnline) {
    return null;
  }

  return (
    <View className={`px-3 py-2 rounded-lg ${className}`}>
      {isOffline ? (
        <View className='flex-row items-center'>
          <View className='w-2 h-2 bg-red-500 rounded-full mr-2' />
          <Text className='text-red-700 text-sm font-medium'>
            Offline - Using cached data
          </Text>
        </View>
      ) : (
        <View className='flex-row items-center'>
          <View className='w-2 h-2 bg-green-500 rounded-full mr-2' />
          <Text className='text-green-700 text-sm font-medium'>
            Online - {networkType}
          </Text>
        </View>
      )}
    </View>
  );
}
