import { useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  ScrollView,
  RefreshControl,
  useColorScheme,
  Platform,
} from 'react-native';
import EventFeed from '../components/EventFeed';
import { Event, Category } from '../types';
import CategorySelector from '../components/CategorySelector';
import * as Haptics from 'expo-haptics';
import { t } from '../lib/i18n';
import { useCategories, useEvents } from '../lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState('wszystkie');
  const [refreshing, setRefreshing] = useState(false);
  const subtleSpinnerColor = isDark ? '#A3A3A3' : '#9CA3AF';
  const queryClient = useQueryClient();
  const {
    data: events = [],
    isFetching: isFetchingEvents,
    isRefetching: isRefetchingEvents,
  } = useEvents();
  const { data: fetchedCategories = [] } = useCategories();

  // Compose categories with the localized "All"
  const categories: Category[] = useMemo(() => {
    return [{ name: t('all'), slug: 'wszystkie' }, ...fetchedCategories];
  }, [fetchedCategories]);

  // Compute filtered events based on selected category
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'wszystkie') return events;
    return events.filter((event) => event.category.slug === selectedCategory);
  }, [events, selectedCategory]);

  // Handle refresh events
  const handleRefresh = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRefreshing(true);
      await queryClient.invalidateQueries({ queryKey: queryKeys.events });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView className='flex-1'>
      <ScrollView
        className='bg-white dark:bg-black'
        contentContainerStyle={{
          backgroundColor: isDark ? 'black' : 'white',
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isFetchingEvents || isRefetchingEvents}
            onRefresh={handleRefresh}
            // iOS supports only a single color; Android supports an array (spins through colors)
            tintColor={Platform.OS === 'ios' ? subtleSpinnerColor : undefined}
            colors={
              Platform.OS === 'android' ? [subtleSpinnerColor] : undefined
            }
            progressBackgroundColor={
              Platform.OS === 'android'
                ? isDark
                  ? '#000000'
                  : '#FFFFFF'
                : undefined
            }
            title={t('refreshingEvents')}
            titleColor={Platform.OS === 'ios' ? subtleSpinnerColor : undefined}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className='bg-white dark:bg-black pb-2'>
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </View>
        <EventFeed
          events={filteredEvents}
          selectedCategory={selectedCategory}
          scrollEnabled={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
