import {
  Text,
  FlatList,
  RefreshControl,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
  useColorScheme,
} from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Event } from '../types';
import EventCard from './EventCard';
import { t } from '../lib/i18n';

interface EventFeedProps {
  events: Event[];
  selectedCategory?: string;
  onRefresh?: () => Promise<void>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEnabled?: boolean;
}

export default function EventFeed({
  events,
  selectedCategory,
  onRefresh,
  onScroll,
  scrollEnabled,
}: EventFeedProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);

  // Handle refresh with haptic feedback and smooth animation
  const handleRefresh = async () => {
    if (!onRefresh) return;

    // Light haptic feedback when starting refresh
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setRefreshing(true);
    try {
      await onRefresh();
      // Success haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Silently fail
    } finally {
      setRefreshing(false);
    }
  };

  const renderEmptyComponent = () => (
    <View className='p-6'>
      <Text className='text-black/70 dark:text-white/70 text-center'>
        {selectedCategory === 'wszystkie'
          ? t('noEventsAll')
          : t('noEventsInCategory')}
      </Text>
    </View>
  );

  const renderEventCard = ({ item, index }: { item: Event; index: number }) => (
    <EventCard event={item} index={index} />
  );

  return (
    <FlatList
      data={events}
      renderItem={renderEventCard}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmptyComponent}
      ItemSeparatorComponent={() => (
        <View className='h-px w-full bg-black/10 dark:bg-[#1F1F1F]' />
      )}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      scrollEnabled={scrollEnabled !== false}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
      className='bg-white dark:bg-black'
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#FFFFFF' : '#000000'}
            title={t('refreshingEvents')}
            titleColor={isDark ? '#FFFFFF' : '#000000'}
          />
        ) : undefined
      }
    />
  );
}
