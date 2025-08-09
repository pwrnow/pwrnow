import { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  ScrollView,
  RefreshControl,
  useColorScheme,
  Platform,
} from 'react-native';
import EventFeed from '../components/EventFeed';
import { api } from '../lib/api';
import { Event, Category } from '../types';
import CategorySelector from '../components/CategorySelector';
import * as Haptics from 'expo-haptics';
import { t } from '../lib/i18n';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState('wszystkie');
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const subtleSpinnerColor = isDark ? '#A3A3A3' : '#9CA3AF';

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [eventsData, categoriesData] = await Promise.all([
        api.events.getEvents(),
        api.categories.getCategories(),
      ]);

      // Add "All" (localized) category at the beginning
      const allCategories: Category[] = [
        { name: t('all'), slug: 'wszystkie' },
        ...categoriesData,
      ];

      setEvents(eventsData);
      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      const eventsData = await api.events.getEvents();
      setEvents(eventsData);
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
            refreshing={refreshing}
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
