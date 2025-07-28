import { useState, useEffect, useRef } from 'react';
import type { ColorSchemeName } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  useColorScheme,
  Platform,
  LayoutAnimation,
  Alert,
  Animated,
  Easing,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Event } from '../types';
import { Colors } from '../constants/Colors';
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
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9'>('16:9');
  const [isImageLoading, setIsImageLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
    Animated.timing(translateYAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [fadeAnim, translateYAnim]);

  // Simplified layout animation
  const animateLayout = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: LayoutAnimation.Types.easeInEaseOut },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
  };

  const handleDescriptionToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateLayout();
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

    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();

      if (status !== 'granted') {
        const { status: newStatus } =
          await Calendar.requestCalendarPermissionsAsync();

        if (newStatus !== 'granted') {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          Alert.alert(
            'Brak uprawnień',
            'Aplikacja potrzebuje dostępu do kalendarza, aby dodać wydarzenie.',
            [
              { text: 'Anuluj', style: 'cancel' },
              { text: 'Ustawienia', onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
      }

      const startsAt = new Date(event.starts_at);
      const endsAt = new Date(event.ends_at);

      const eventData = {
        title: event.title,
        startDate: startsAt,
        endDate: endsAt,
        location: event.location || '',
        notes: event.description || '',
      };

      const result = await Calendar.createEventInCalendarAsync(eventData);

      if (result.action === Calendar.CalendarDialogResultActions.saved) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        Alert.alert(
          'Sukces!',
          `Wydarzenie "${event.title}" zostało dodane do kalendarza.`,
          [{ text: 'OK' }]
        );
      } else if (
        result.action === Calendar.CalendarDialogResultActions.canceled
      ) {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Błąd',
        'Nie udało się otworzyć kalendarza. Spróbuj ponownie.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEventLinkPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (event.url) {
      Linking.openURL(event.url);
    }
  };

  const handleMapPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (event.location) {
      const encodedLocation = encodeURIComponent(event.location);

      const urls = Platform.select({
        ios: {
          primary: `maps://maps.apple.com/?q=${encodedLocation}`,
          fallback: `http://maps.apple.com/?q=${encodedLocation}`,
        },
        android: {
          primary: `geo:0,0?q=${encodedLocation}`,
          fallback: `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`,
        },
      });

      if (!urls) return;

      const canOpenPrimary = await Linking.canOpenURL(urls.primary);
      Linking.openURL(canOpenPrimary ? urls.primary : urls.fallback);
    }
  };

  const startsAt = new Date(event.starts_at);
  const endsAt = new Date(event.ends_at);

  const isEventToday = (() => {
    const eventDate = startsAt;
    const today = new Date();
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  })();

  // Format date and time
  const dateString = startsAt.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const timeString = `${startsAt.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${endsAt.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Detect image aspect ratio
  useEffect(() => {
    const imageUrl = event.image_url || 'https://via.placeholder.com/800x600';
    // Only check for remote images
    if (imageUrl) {
      Image.getSize(
        imageUrl,
        (width, height) => {
          const ratio = width / height;
          if (Math.abs(ratio - 1) <= 0.1) {
            setAspectRatio('1:1');
          } else if (Math.abs(ratio - 16 / 9) <= 0.1) {
            setAspectRatio('16:9');
          } else {
            setAspectRatio('16:9'); // Default
          }
          setIsImageLoading(false);
        },
        () => {
          setAspectRatio('16:9');
          setIsImageLoading(false);
        }
      );
    }
  }, [event.image_url]);

  const styles = createStyles(colors, colorScheme);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            {event.organization?.image_url ? (
              <Image
                source={{ uri: event.organization.image_url }}
                style={styles.avatar}
              />
            ) : (
              <LinearGradient
                colors={[colors.primary + '33', colors.secondary + '33']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {getInitials(event.organization.name)}
                </Text>
              </LinearGradient>
            )}
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.organizationName} numberOfLines={1}>
              {event.organization.name}
            </Text>
            <Text style={styles.categoryText}>{event.category.name}</Text>
          </View>
        </View>
        <View style={styles.badgesContainer}>
          {isEventToday ? (
            <View style={[styles.badge, styles.todayBadge]}>
              <View style={styles.badgeIconContainer}>
                <Feather name='zap' size={12} color={colors.accent} />
              </View>
              <Text style={[styles.badgeText, styles.todayBadgeText]}>
                Dziś!
              </Text>
            </View>
          ) : (
            event.is_new && (
              <View style={[styles.badge, styles.newBadge]}>
                <View style={styles.badgeIconContainer}>
                  <Feather name='award' size={12} color={colors.primary} />
                </View>
                <Text style={[styles.badgeText, styles.newBadgeText]}>
                  Nowe
                </Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* Event Image */}
      <View
        style={[
          styles.imageContainer,
          aspectRatio === '1:1'
            ? { aspectRatio: 1, width: '100%' }
            : { aspectRatio: 16 / 9, width: '100%' },
        ]}
      >
        <Image
          source={{
            uri: event.image_url || 'https://via.placeholder.com/800x600',
          }}
          style={[
            styles.eventImage,
            { width: '100%', height: '100%', position: 'absolute' },
          ]}
          resizeMode='cover'
          onLoadEnd={() => setIsImageLoading(false)}
        />
        {isImageLoading && (
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: colors.muted,
            }}
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{event.title}</Text>
          {/* Share Button */}
          <TouchableOpacity
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const isAvailable = await Sharing.isAvailableAsync();
              if (!isAvailable) {
                Alert.alert(
                  'Udostępnianie niedostępne',
                  'Funkcja udostępniania nie jest dostępna na tym urządzeniu.'
                );
                return;
              }

              const shareUrl = `${config.shareBaseUrl}/${event.slug}`;

              try {
                await Sharing.shareAsync(shareUrl, {
                  dialogTitle: 'Udostępnij wydarzenie',
                });
              } catch (e) {
                Alert.alert('Błąd', 'Nie udało się udostępnić wydarzenia.');
              }
            }}
            style={styles.shareButton}
            accessibilityLabel='Udostępnij wydarzenie'
          >
            <Feather name='share' size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Event Details */}
        <View style={styles.detailsContainer}>
          <TouchableOpacity
            style={styles.detailRow}
            onPress={handleAddToCalendar}
          >
            <View style={[styles.iconContainer, styles.dateIcon]}>
              <Feather name='calendar' size={18} color={colors.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailText}>{dateString}</Text>
              {showCalendarHint && (
                <Text style={styles.calendarHint}>
                  Stuknij, aby dodać do kalendarza
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailRow}
            onPress={handleAddToCalendar}
          >
            <View style={[styles.iconContainer, styles.timeIcon]}>
              <Feather name='clock' size={18} color={colors.purple} />
            </View>
            <Text style={styles.detailText}>{timeString}</Text>
          </TouchableOpacity>

          {event.location && (
            <View style={styles.detailRow}>
              <View style={[styles.iconContainer, styles.locationIcon]}>
                <Feather name='map-pin' size={22} color={colors.accent} />
              </View>
              <TouchableOpacity
                onPress={handleMapPress}
                style={styles.locationButton}
              >
                <Text style={styles.locationText}>{event.location}</Text>
                <Feather name='external-link' size={18} color={'#14181f'} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Description */}
        {event.description && (
          <View style={styles.descriptionContainer}>
            <Text
              style={styles.description}
              numberOfLines={isDescriptionExpanded ? undefined : 3}
            >
              {event.description}
            </Text>
            {event.description.length > 150 && (
              <TouchableOpacity onPress={handleDescriptionToggle}>
                <Text style={styles.expandButton}>
                  {isDescriptionExpanded ? 'Pokaż mniej' : 'Pokaż więcej'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Button */}
        {event.url && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEventLinkPress}
          >
            <Feather name='external-link' size={16} color='white' />
            <Text style={styles.actionButtonText}>
              Odwiedź stronę wydarzenia
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const createStyles = (colors: any, colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      marginBottom: 24,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.card,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    headerTextContainer: {
      flexDirection: 'column',
      flex: 1,
    },
    avatarContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    avatar: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '700',
      fontFamily: 'SpaceGrotesk-Bold',
    },
    organizationName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'SpaceGrotesk-Bold',
    },
    categoryText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'SpaceGrotesk-Regular',
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      // height is set by aspectRatio inline
      backgroundColor: colors.muted,
      overflow: 'hidden',
    },
    eventImage: {
      // width and height are set inline
      // backgroundColor: colors.muted, // moved to imageContainer
    },
    // Improved badge styles
    badgesContainer: {
      flexDirection: 'row',
      gap: 6,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 16,
      gap: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    newBadge: {
      backgroundColor: colors.primary + '15',
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    todayBadge: {
      backgroundColor: colors.accent + '15',
      borderWidth: 1,
      borderColor: colors.accent + '30',
    },

    badgeIconContainer: {
      width: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
      fontFamily: 'SpaceGrotesk-SemiBold',
    },
    newBadgeText: {
      color: colors.primary,
    },
    todayBadgeText: {
      color: colors.accent,
    },

    content: {
      padding: 20,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 32,
      fontFamily: 'Righteous-Regular',
      flex: 1,
    },
    detailsContainer: {
      gap: 12,
      marginBottom: 16,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dateIcon: {
      backgroundColor: colorScheme === 'dark' ? '#172554' : '#dbeafe', // blue-950 for dark, blue-100 for light
    },
    timeIcon: {
      backgroundColor: colorScheme === 'dark' ? '#581c87' : '#f3e8ff', // purple-950 for dark, purple-100 for light
    },
    locationIcon: {
      backgroundColor: colorScheme === 'dark' ? '#450a0a' : '#fee2e2', // red-950 for dark, red-100 for light
    },
    detailText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
      fontFamily: 'SpaceGrotesk-Medium',
      flex: 1,
    },
    locationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
    },
    locationText: {
      fontSize: 17,
      fontWeight: '600',
      color: '#14181f', // black (web --foreground)
      fontFamily: 'SpaceGrotesk-SemiBold',
    },
    calendarHint: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'SpaceGrotesk-Regular',
      marginTop: 2,
      marginLeft: 0,
      backgroundColor: 'transparent',
      fontStyle: 'normal',
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    descriptionContainer: {
      marginBottom: 20,
    },
    description: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.mutedForeground,
      marginBottom: 8,
      fontFamily: 'SpaceGrotesk-Regular',
    },
    expandButton: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      fontFamily: 'SpaceGrotesk-SemiBold',
      textDecorationLine: 'underline',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    actionButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'SpaceGrotesk-SemiBold',
    },
    shareButton: {
      padding: 8,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.muted + '40',
    },
  });
