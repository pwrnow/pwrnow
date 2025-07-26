import { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
  Alert,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import CategorySelector from '../components/CategorySelector';
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

  // Scroll tracking
  const lastScrollY = useRef(0);
  const isHidden = useRef(false);
  const [pointerEventsEnabled, setPointerEventsEnabled] = useState(true);
  const categoryHeight = useSharedValue(58); // Normal height
  const categoryOpacity = useSharedValue(1);

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

  // Handle scroll events - with complete edge bounce protection
  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const currentScrollY = contentOffset.y;
    const contentHeight = contentSize.height;
    const screenHeight = layoutMeasurement.height;
    const diff = currentScrollY - lastScrollY.current;

    // Ignore tiny movements
    if (Math.abs(diff) < 5) return;

    // Always show at the very top
    if (currentScrollY <= 10) {
      if (isHidden.current) {
        isHidden.current = false;
        setPointerEventsEnabled(true);
        categoryHeight.value = withTiming(58, { duration: 300 });
        categoryOpacity.value = withTiming(1, { duration: 300 });
      }
      lastScrollY.current = currentScrollY;
      return;
    }

    // Check if we're at the bottom (within 20px of bottom)
    const isAtBottom = currentScrollY + screenHeight >= contentHeight - 20;

    // Ignore scroll events at the bottom to prevent bounce glitches
    if (isAtBottom) {
      lastScrollY.current = currentScrollY;
      return;
    }

    // Prevent edge bounce detection - ignore if at exact same position
    if (currentScrollY === lastScrollY.current) return;

    // Only process significant scroll movements
    if (Math.abs(diff) < 15) return;

    const scrollingDown = diff > 0;

    if (scrollingDown && !isHidden.current) {
      // Scrolling down - hide
      isHidden.current = true;
      setPointerEventsEnabled(false);
      categoryHeight.value = withTiming(0, { duration: 300 });
      categoryOpacity.value = withTiming(0, { duration: 300 });
    } else if (!scrollingDown && isHidden.current) {
      // Scrolling up - show
      isHidden.current = false;
      setPointerEventsEnabled(true);
      categoryHeight.value = withTiming(58, { duration: 300 });
      categoryOpacity.value = withTiming(1, { duration: 300 });
    }

    lastScrollY.current = currentScrollY;
  };

  // Animated style for category selector
  const categoryAnimatedStyle = useAnimatedStyle(() => ({
    height: categoryHeight.value,
    opacity: categoryOpacity.value,
    overflow: 'hidden',
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {/* Smooth Animated Category Selector */}
      {categories.length > 0 && (
        <Animated.View
          style={[styles.categoryContainer, categoryAnimatedStyle]}
          pointerEvents={pointerEventsEnabled ? 'auto' : 'none'}
        >
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </Animated.View>
      )}

      <View style={styles.eventFeedContainer}>
        <EventFeed
          events={events}
          selectedCategory={selectedCategory}
          onRefresh={handleRefresh}
          onScroll={handleScroll}
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
    categoryContainer: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      // Add subtle shadow for depth
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 1,
      elevation: 1,
    },
    eventFeedContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
