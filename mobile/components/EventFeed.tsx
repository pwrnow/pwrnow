import {
  Text,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { Event } from '../types';
import EventCard from './EventCard';
import { t } from '../lib/i18n';

interface EventFeedProps {
  events: Event[];
  selectedCategory?: string;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEnabled?: boolean;
  onClearCategory?: () => void;
}

export default function EventFeed({
  events,
  selectedCategory,
  onScroll,
  scrollEnabled,
  onClearCategory,
}: EventFeedProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing] = useState(false);

  const renderEmptyComponent = () => (
    <View className='p-6 items-center'>
      <Text className='text-black/70 dark:text-white/70 text-center text-sm'>
        {selectedCategory === 'wszystkie'
          ? t('noEventsAll')
          : t('noEventsInCategory')}
      </Text>
      {selectedCategory !== 'wszystkie' && onClearCategory ? (
        <TouchableOpacity
          onPress={onClearCategory}
          activeOpacity={0.6}
          className='mt-3'
        >
          <Text className='text-accentBlue text-sm'>{t('showAllEvents')}</Text>
        </TouchableOpacity>
      ) : null}
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
      contentContainerStyle={{ paddingBottom: 24 }}
      className='bg-white dark:bg-black'
      refreshControl={undefined}
    />
  );
}
