import {
  Text,
  FlatList,
  RefreshControl,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Event } from '../types';
import EventCard from './EventCard';

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
    <View style={{ padding: 24 }}>
      <Text style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
        {selectedCategory === 'wszystkie'
          ? 'Aktualnie brak dostępnych wydarzeń.'
          : 'Brak wydarzeń w tej kategorii.'}
      </Text>
    </View>
  );

  const renderEventCard = ({ item }: { item: Event; index: number }) => (
    <EventCard event={item} />
  );

  return (
    <FlatList
      data={events}
      renderItem={renderEventCard}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmptyComponent}
      ItemSeparatorComponent={() => (
        <View
          style={{
            height: 1,
            backgroundColor: '#1F1F1F',
            width: '100%',
          }}
        />
      )}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      scrollEnabled={scrollEnabled !== false}
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: 24,
        backgroundColor: '#000000',
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={'#FFFFFF'}
            title='Odświeżanie wydarzeń...'
            titleColor={'#FFFFFF'}
          />
        ) : undefined
      }
    />
  );
}
