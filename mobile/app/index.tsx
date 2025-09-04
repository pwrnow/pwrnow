import { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import EventFeed from '../components/EventFeed';
import { Event, Category } from '../types';
import CategorySelector from '../components/CategorySelector';
import * as Haptics from 'expo-haptics';
import { t } from '../lib/i18n';
import {
  useCategories,
  useEvents,
  usePrefetchEventDetails,
} from '../lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../lib/api';

export default function HomeScreen() {
  const { colors, isDark } = useThemeColors();
  const [selectedCategory, setSelectedCategory] = useState('wszystkie');
  const [refreshing, setRefreshing] = useState(false);
  const subtleSpinnerColor = isDark ? '#A3A3A3' : '#9CA3AF';
  const queryClient = useQueryClient();
  const { isLoading, isAuthenticated } = useAuth();
  const { prefetchAllEventDetails } = usePrefetchEventDetails();
  const insets = useSafeAreaInsets();
  const hasPrefetchedRef = useRef(false);

  const {
    data: events = [],
    isFetching: isFetchingEvents,
    isRefetching: isRefetchingEvents,
    status: eventsStatus,
    fetchStatus,
  } = useEvents();
  const { data: fetchedCategories = [] } = useCategories();

  // Prefetch event details when events are loaded (only once)
  useEffect(() => {
    if (events.length > 0 && !hasPrefetchedRef.current) {
      hasPrefetchedRef.current = true;
      // Prefetch details for all events with a delay between each request
      const eventSlugs = events.map((event) => event.slug);
      prefetchAllEventDetails(eventSlugs, 500).catch((error) => {
        console.warn('Failed to prefetch event details:', error);
      });
    }
  }, [events.length, prefetchAllEventDetails]);

  // Compose categories with the localized "All"
  const categories: Category[] = [
    { name: t('all'), slug: 'wszystkie' },
    ...fetchedCategories,
  ];

  // Compute filtered events based on selected category
  const filteredEvents =
    selectedCategory === 'wszystkie'
      ? events
      : events.filter((event) => event.category.slug === selectedCategory);

  // Handle refresh events
  const handleRefresh = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRefreshing(true);
      hasPrefetchedRef.current = false; // Reset prefetch flag on refresh
      await queryClient.invalidateQueries({ queryKey: queryKeys.events });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // fetch evetns all manyulal and priunt all likes
  // const fetchEventsAndLikes = async () => {
  //   const events = await api.events.getEvents();
  //   for (const event of events) {
  //     console.log('event', event.title, event.liked);
  //     console.log('event.schedule', event.schedule);
  //   }
  // };

  // fetchEventsAndLikes();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#000000' : '#FFFFFF',
        // paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <ScrollView
        style={{ backgroundColor: isDark ? '#000000' : '#FFFFFF' }}
        contentContainerStyle={{
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
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
              Platform.OS === 'android' ? colors.background : undefined
            }
            title={t('refreshingEvents')}
            titleColor={Platform.OS === 'ios' ? subtleSpinnerColor : undefined}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ backgroundColor: colors.background }} className='pb-2'>
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </View>
        <EventFeed
          events={filteredEvents}
          selectedCategory={selectedCategory}
          onClearCategory={() => setSelectedCategory('wszystkie')}
          scrollEnabled={false}
        />
      </ScrollView>
    </View>
  );
}
