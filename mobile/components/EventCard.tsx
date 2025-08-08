import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Image,
  Platform,
  Alert,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Event } from '../types';
import { config } from '../lib/config';

interface EventCardProps {
  event: Event;
  showCalendarHint?: boolean;
}

export default function EventCard({
  event,
  showCalendarHint = false,
}: EventCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleDescriptionToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  useEffect(() => {
    if (showCalendarHint) {
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 1000);
    }
  }, [showCalendarHint]);

  const handleAddToCalendar = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Funkcja kalendarza',
      'Funkcja dodawania do kalendarza jest obecnie niedostępna.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleEventLinkPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = `${config.shareBaseUrl}/${event.slug}`;
    await Linking.openURL(url);
  };

  const handleMapPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = `https://maps.apple.com/?q=${encodeURIComponent(
      event.location || ''
    )}`;
    await Linking.openURL(url);
  };

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const shareUrl = `${config.shareBaseUrl}/${event.slug}`;
    const shareText = `${event.title}\n\n${
      event.description || ''
    }\n\nWiecej informacji: ${shareUrl}`;

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(shareUrl, {
        mimeType: 'text/plain',
        dialogTitle: 'Udostępnij wydarzenie',
      });
    } else {
      // Fallback for platforms where Sharing is not available
      Alert.alert('Udostępnij', shareText);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    return (
      today.getDate() === eventDate.getDate() &&
      today.getMonth() === eventDate.getMonth() &&
      today.getFullYear() === eventDate.getFullYear()
    );
  };

  return (
    <View>
      <Text>{getInitials(event.organization.name)}</Text>
      <Text>{event.organization.name}</Text>
      <Text>{event.category.name}</Text>

      {event.image_url && (
        <Image
          source={{ uri: event.image_url }}
          onLoadStart={() => setIsImageLoading(true)}
          onLoadEnd={() => setIsImageLoading(false)}
        />
      )}

      <Text>{event.title}</Text>

      <Feather name='calendar' size={20} />
      <Text>{formatDate(event.starts_at)}</Text>

      <Feather name='clock' size={20} />
      <Text>
        {formatTime(event.starts_at)} - {formatTime(event.ends_at)}
      </Text>

      <Feather name='map-pin' size={20} />
      <TouchableOpacity onPress={handleMapPress}>
        <Text>{event.location}</Text>
      </TouchableOpacity>

      {showCalendarHint && (
        <Text>
          Dotknij przycisku poniżej, aby dodać wydarzenie do kalendarza
        </Text>
      )}

      {event.description && (
        <Text>
          {isDescriptionExpanded
            ? event.description
            : `${event.description.slice(0, 150)}${
                event.description.length > 150 ? '...' : ''
              }`}
        </Text>
      )}

      {event.description && event.description.length > 150 && (
        <TouchableOpacity onPress={handleDescriptionToggle}>
          <Text>{isDescriptionExpanded ? 'Zwiń' : 'Rozwiń'}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={handleAddToCalendar}>
        <Feather name='calendar' size={20} />
        <Text>Dodaj do kalendarza</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleEventLinkPress}>
        <Feather name='external-link' size={20} />
        <Text>Otwórz w przeglądarce</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleShare}>
        <Feather name='share-2' size={20} />
      </TouchableOpacity>
    </View>
  );
}
