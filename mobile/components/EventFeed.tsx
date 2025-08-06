import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useColorScheme,
  RefreshControl,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Event, Category } from '../types';
import EventCard from './EventCard';
import CategorySelector from './CategorySelector';
import { Colors } from '../constants/Colors';

interface EventFeedProps {
  events: Event[];
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categorySlug: string) => void;
  onRefresh?: () => Promise<void>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export default function EventFeed({
  events,
  categories,
  selectedCategory,
  onCategoryChange,
  onRefresh,
  onScroll,
}: EventFeedProps) {
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = createStyles(colors);

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

  // Filter events based on selected category
  const filteredEvents =
    selectedCategory === 'wszystkie'
      ? events
      : events.filter((event) => event.category.slug === selectedCategory);

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {selectedCategory === 'wszystkie'
          ? 'Aktualnie brak dostępnych wydarzeń.'
          : 'Brak wydarzeń w tej kategorii.'}
      </Text>
    </View>
  );

  const renderEventCard = ({ item, index }: { item: Event; index: number }) => (
    <EventCard event={item} showCalendarHint={index === 0} />
  );

  const renderHeader = () => (
    <CategorySelector
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={onCategoryChange}
    />
  );

  return (
    <FlatList
      data={filteredEvents}
      renderItem={renderEventCard}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmptyComponent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      onScroll={onScroll}
      scrollEventThrottle={16} // Standard throttle for smooth tracking
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary, colors.secondary]}
          progressBackgroundColor={colors.background}
          title='Odświeżanie wydarzeń...'
          titleColor={colors.mutedForeground}
          progressViewOffset={20}
        />
      }
    />
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingBottom: 40,
      backgroundColor: colors.background,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
      paddingHorizontal: 40,
      backgroundColor: colors.background,
    },
    emptyText: {
      fontSize: 18,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 28,
      fontFamily: 'SpaceGrotesk-Medium',
      opacity: 0.8,
    },
  });
