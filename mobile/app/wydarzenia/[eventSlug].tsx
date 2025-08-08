import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { api } from '../../lib/api';
import EventCard from '../../components/EventCard';
import Header from '../../components/Header';
import { Event } from '../../types';

export default function EventDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { eventSlug } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof eventSlug === 'string') {
      fetchEvent(eventSlug);
    }
  }, [eventSlug]);

  const fetchEvent = async (slug: string) => {
    try {
      setLoading(true);
      const eventData = await api.events.getEventBySlug(slug);
      if (!eventData) throw new Error('Event not found');
      setEvent(eventData);
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się załadować wydarzenia.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-white dark:bg-black'>
      <Header onBack={() => router.replace('/')} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
      >
        {loading ? (
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
