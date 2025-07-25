import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { api } from '../lib/api';
import EventCard from '../components/EventCard';
import Header from '../components/Header';
import { Event } from '../types';
import { Feather } from '@expo/vector-icons';

export default function EventDetailScreen() {
  const { eventSlug } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = createStyles(colors);

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
    <SafeAreaView style={styles.container}>
      <Header onBack={() => router.replace('/')} />
      <ScrollView
        contentContainerStyle={styles.eventFeedContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size='large' color={colors.primary} />
        ) : event ? (
          <EventCard event={event} />
        ) : null}
      </ScrollView>
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
      paddingTop: 8,
      paddingBottom: 40,
      backgroundColor: colors.background,
      // No alignItems or justifyContent for list-like layout
    },
  });
