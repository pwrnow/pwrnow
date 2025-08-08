import { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  ScrollView,
  RefreshControl,
  useColorScheme,
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
    <SafeAreaView className='flex-1 bg-white dark:bg-black'>
      <ScrollView
        className='bg-white dark:bg-black'
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#FFFFFF' : '#000000'}
            title={t('refreshingEvents')}
            titleColor={isDark ? '#FFFFFF' : '#000000'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className='pt-3 bg-white dark:bg-black'>
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
