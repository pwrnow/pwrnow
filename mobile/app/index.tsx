import { useState, useEffect } from 'react';
import { View, StyleSheet, useColorScheme, SafeAreaView } from 'react-native';
import EventFeed from '../components/EventFeed';
import { api } from '../lib/api';
import { Event, Category } from '../types';
import { Colors } from '../constants/Colors';
import Header from '../components/Header';

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('wszystkie');
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = createStyles(colors);

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

  // Handle refresh events
  const handleRefresh = async () => {
    try {
      const eventsData = await api.events.getEvents();
      setEvents(eventsData);
      console.log('Events refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing events:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.eventFeedContainer}>
        <EventFeed
          events={events}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onRefresh={handleRefresh}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.card,
    },
    eventFeedContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
