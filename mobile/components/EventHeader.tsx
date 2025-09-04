import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import LikeButton from './LikeButton';

interface EventHeaderProps {
  title: string;
  isLiked: boolean;
  onLikePress: () => void;
  isAuthenticated: boolean;
  iconPrimary: string;
}

export const EventHeader: React.FC<EventHeaderProps> = React.memo(
  ({ title, isLiked, onLikePress, isAuthenticated, iconPrimary }) => {
    const router = useRouter();

    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        className='flex-row items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10'
      >
        <TouchableOpacity onPress={() => router.back()} className='p-2 -ml-2'>
          <Feather name='arrow-left' size={24} color={iconPrimary} />
        </TouchableOpacity>
        <Text
          className='flex-1 text-center font-groteskSemibold text-black dark:text-white mx-4'
          numberOfLines={2}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
          style={{
            fontSize: 16,
            lineHeight: 20,
          }}
        >
          {title}
        </Text>
        <View className='flex-row items-center'>
          <LikeButton
            isLiked={isLiked}
            onPress={onLikePress}
            size={20}
            className='mr-2'
            isAuthenticated={isAuthenticated}
          />
        </View>
      </Animated.View>
    );
  }
);

export default EventHeader;
