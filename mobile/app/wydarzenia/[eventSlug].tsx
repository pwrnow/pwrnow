import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  useColorScheme,
} from 'react-native';
import EventCard from '../../components/EventCard';
import { Event } from '../../types';
import { useAnalytics } from '../../lib/analytics';
import { useEventBySlug } from '../../lib/queries';

export default function EventDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { eventSlug } = useLocalSearchParams();
  const router = useRouter();
  const analytics = useAnalytics();
  const {
    data: event,
    isLoading,
    error,
  } = useEventBySlug(typeof eventSlug === 'string' ? eventSlug : undefined);

  useEffect(() => {
    if (event) {
      analytics.trackEventDetailViewed(event as any, 'navigation');
    }
  }, [event]);

  // Ensure a back target exists when opening this screen from a universal link
  // by injecting the home route before the event route on first mount.
  useEffect(() => {
    if (!router.canGoBack() && typeof eventSlug === 'string') {
      const eventPath = `/wydarzenia/${eventSlug}`;
      // Replace current (deep-linked) route with home, then push the event.
      // Using timeouts to sequence navigation and avoid race conditions.
      setTimeout(() => {
        router.replace('/');
        setTimeout(() => {
          router.push(eventPath as any);
        }, 0);
      }, 0);
    }
    // We intentionally run only on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Błąd', 'Nie udało się załadować wydarzenia.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    }
  }, [error]);

  return (
    <SafeAreaView className='flex-1 bg-white dark:bg-black'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
      >
        {isLoading ? (
          <ActivityIndicator
            size='large'
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        ) : event ? (
          <EventCard event={event} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
