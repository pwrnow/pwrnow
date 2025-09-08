import {
  Text,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
  TouchableOpacity,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Event } from '../types';
import EventCard from './EventCard';
import { t } from '../lib/i18n';
import { useThemeColors } from '../hooks/useThemeColors';
import { useImagePreloading } from '../hooks/useImagePreloading';

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
  const { colors } = useThemeColors();
  const [refreshing] = useState(false);
  const { preloadEventImages } = useImagePreloading();

  // Preload images when events change
  useEffect(() => {
    if (events.length > 0) {
      preloadEventImages(events);
    }
  }, [events, preloadEventImages]);

  const renderEmptyComponent = () => (
    <View className='p-6 items-center'>
      <Text
        style={{ color: colors.mutedForeground }}
        className='text-center text-sm'
      >
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
          <Text style={{ color: colors.primary }} className='text-sm'>
            {t('showAllEvents')}
          </Text>
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
        <View
          style={{ backgroundColor: colors.border }}
          className='h-px w-full'
        />
      )}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      scrollEnabled={scrollEnabled !== false}
      contentContainerStyle={{ paddingBottom: 24 }}
      style={{ backgroundColor: colors.background }}
      refreshControl={undefined}
    />
  );
}
