import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import LikeButton from './LikeButton';
import ShareButton from './ShareButton';
import { useThemeColors } from '../hooks/useThemeColors';
import { Event } from '../types';

interface EventHeaderProps {
  title: string;
  isLiked: boolean;
  onLikePress: () => void;
  isAuthenticated: boolean;
  iconPrimary: string;
  event: Event;
}

export const EventHeader: React.FC<EventHeaderProps> = React.memo(
  ({ title, isLiked, onLikePress, isAuthenticated, iconPrimary, event }) => {
    const { colors } = useThemeColors();
    const router = useRouter();

    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{ borderBottomColor: colors.border }}
        className='flex-row items-center justify-between px-4 py-3 border-b'
      >
        <TouchableOpacity onPress={() => router.back()} className='p-2 -ml-2'>
          <Feather name='arrow-left' size={24} color={iconPrimary} />
        </TouchableOpacity>
        <Text
          style={{
            color: colors.foreground,
            fontSize: 16,
            lineHeight: 20,
          }}
          className='flex-1 text-center font-groteskSemibold mx-4'
          numberOfLines={2}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >
          {title}
        </Text>
        <View className='flex-row items-center gap-1'>
          <ShareButton event={event} size={20} />
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
