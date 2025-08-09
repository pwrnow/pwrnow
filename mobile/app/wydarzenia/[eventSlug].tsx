import { useEffect, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  useColorScheme,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import EventCard from '../../components/EventCard';
import { Event } from '../../types';
import { useAnalytics } from '../../lib/analytics';
import { useEventBySlug } from '../../lib/queries';
import { useFocusEffect, useNavigation } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function EventDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { eventSlug } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const analytics = useAnalytics();
  const {
    data: event,
    isLoading,
    error,
  } = useEventBySlug(typeof eventSlug === 'string' ? eventSlug : undefined);

  const handleBack = useCallback(() => {
    // @ts-ignore navigation.canGoBack exists in React Navigation
    if (
      typeof (navigation as any).canGoBack === 'function' &&
      (navigation as any).canGoBack()
    ) {
      // @ts-ignore goBack exists
      (navigation as any).goBack();
    } else {
      router.replace('/');
    }
  }, [navigation, router]);

  useEffect(() => {
    // Replace default back button with a fallback-aware back button
    // @ts-ignore setOptions exists
    (navigation as any)?.setOptions?.({
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleBack}
          accessibilityLabel='Go back'
          style={{ paddingHorizontal: 12 }}
        >
          <Feather
            name='arrow-left'
            size={22}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleBack, isDark]);

  useFocusEffect(
    useCallback(() => {
      const onHardwareBackPress = () => {
        // If there's no history (deep/universal link), redirect to root
        // @ts-ignore canGoBack exists
        if (
          !(navigation as any).canGoBack ||
          !(navigation as any).canGoBack()
        ) {
          router.replace('/');
          return true; // we handled it
        }
        return false; // let default back occur
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onHardwareBackPress
      );
      return () => subscription.remove();
    }, [navigation, router])
  );

  useEffect(() => {
    if (event) {
      analytics.trackEventDetailViewed(event as any, 'navigation');
    }
  }, [event]);

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
