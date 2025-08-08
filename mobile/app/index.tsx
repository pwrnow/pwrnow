import { useState, useEffect, useMemo } from 'react';
import { SafeAreaView, View, ScrollView, RefreshControl } from 'react-native';
import EventFeed from '../components/EventFeed';
import { api } from '../lib/api';
import { Event, Category } from '../types';
import Header from '../components/Header';
import CategorySelector from '../components/CategorySelector';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
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

      // Add "Wszystkie" category at the beginning
      const allCategories: Category[] = [
        { name: 'Wszystkie', slug: 'wszystkie' },
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <Header logoSize='large' />
      <ScrollView
        contentContainerStyle={{ backgroundColor: '#000000' }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={'#FFFFFF'}
            title='Odświeżanie wydarzeń...'
            titleColor={'#FFFFFF'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: 6, backgroundColor: '#000000' }}>
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
