import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Image,
  Alert,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Event } from '../types';
import { config } from '../lib/config';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const getAspectRatio = (ratio?: string | null): number => {
    if (!ratio) return 16 / 9;
    // Handle explicit common labels
    if (ratio === '1:1') return 1;
    if (ratio === '16:9') return 16 / 9;
    if (ratio === '4:3') return 4 / 3;
    if (ratio === '3:2') return 3 / 2;
    // Handle generic WIDTH:HEIGHT strings like "1200:628"
    if (ratio.includes(':')) {
      const [widthString, heightString] = ratio.split(':');
      const width = parseFloat(widthString);
      const height = parseFloat(heightString);
      if (Number.isFinite(width) && Number.isFinite(height) && height > 0) {
        return width / height;
      }
    }
    return 16 / 9;
  };

  const imageAspectRatio = getAspectRatio(event.aspect_ratio);

  const handleDescriptionToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const handleAddToCalendar = async () => {
    await Haptics.selectionAsync();
    Alert.alert(
      'Kalendarz',
      'Dodawanie do kalendarza będzie dostępne wkrótce.'
    );
  };

  const handleEventLinkPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = event.url || `${config.shareBaseUrl}/${event.slug}`;
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

  const formatDateRangeShort = (startString: string, endString: string) => {
    const startDate = new Date(startString);
    const endDate = new Date(endString);
    const now = new Date();

    const sameDay =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate();

    const sameMonthAndYear =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth();

    const shouldShowYear =
      startDate.getFullYear() !== now.getFullYear() ||
      endDate.getFullYear() !== now.getFullYear() ||
      startDate.getFullYear() !== endDate.getFullYear();

    const monthLong = (d: Date) =>
      d.toLocaleDateString('pl-PL', {
        month: 'long',
      });
    const day = (d: Date) => d.getDate();

    if (sameDay) {
      return `${day(startDate)} ${monthLong(startDate)}$${
        shouldShowYear ? ` ${startDate.getFullYear()}` : ''
      }`.replace('$', '');
    }

    if (sameMonthAndYear) {
      return `${day(startDate)}–${day(endDate)} ${monthLong(startDate)}$${
        shouldShowYear ? ` ${startDate.getFullYear()}` : ''
      }`.replace('$', '');
    }

    const startYearPart = shouldShowYear ? ` ${startDate.getFullYear()}` : '';
    const endYearPart = shouldShowYear ? ` ${endDate.getFullYear()}` : '';
    return `${day(startDate)} ${monthLong(startDate)}${startYearPart}–${day(
      endDate
    )} ${monthLong(endDate)}${endYearPart}`;
  };

  const formatTimeRangeShort = (startString: string, endString: string) => {
    const startDate = new Date(startString);
    const endDate = new Date(endString);

    const time = (d: Date) =>
      d.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
      });

    return `${time(startDate)}–${time(endDate)}`;
  };

  return (
    <View
      className='mb-0'
      style={{
        backgroundColor: '#000000',
      }}
    >
      {/* Header: org + category */}
      <View className='px-4 pt-4 pb-3'>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              overflow: 'hidden',
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {event.organization.image_url ? (
              <Image
                source={{ uri: event.organization.image_url }}
                style={{ width: '100%', height: '100%', borderRadius: 999 }}
                resizeMode='cover'
              />
            ) : (
              <Text
                style={{
                  color: '#FFFFFF',
                  fontFamily: 'SpaceGrotesk-SemiBold',
                  fontSize: 14,
                }}
              >
                {getInitials(event.organization.name)}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: '#FFFFFF',
                fontFamily: 'SpaceGrotesk-SemiBold',
                fontSize: 14,
                lineHeight: 18,
              }}
              numberOfLines={1}
            >
              {event.organization.name}
            </Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: 12,
                lineHeight: 16,
                marginTop: 1,
              }}
            >
              {event.category.name}
            </Text>
          </View>
          {event.is_new ? (
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 12,
                backgroundColor: 'rgba(236,46,129,0.15)',
                borderColor: 'rgba(236,46,129,0.3)',
                borderWidth: 1,
              }}
            >
              <Text
                style={{
                  color: '#EC2E81',
                  fontSize: 11,
                  fontFamily: 'SpaceGrotesk-SemiBold',
                  letterSpacing: 0.5,
                }}
              >
                NOWE
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Image */}
      {event.image_url ? (
        <View>
          <TouchableOpacity onPress={handleEventLinkPress} activeOpacity={0.92}>
            <View
              style={{
                width: '100%',
                aspectRatio: imageAspectRatio,
                backgroundColor: '#111111',
                borderRadius: 0,
                overflow: 'visible',
              }}
            >
              <Image
                source={{ uri: event.image_url }}
                onLoadStart={() => setIsImageLoading(true)}
                onLoadEnd={() => setIsImageLoading(false)}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                resizeMode='cover'
              />
            </View>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Content */}
      <View className='px-4 pt-4 pb-5'>
        {/* Title and Share */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontFamily: 'SpaceGrotesk-SemiBold',
              fontSize: 20,
              lineHeight: 26,
              flex: 1,
              marginRight: 12,
            }}
            numberOfLines={3}
          >
            {event.title}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            style={{
              backgroundColor: 'rgba(236,46,129,0.12)',
              borderColor: 'rgba(236,46,129,0.25)',
              borderWidth: 1,
              borderRadius: 10,
              padding: 10,
            }}
          >
            <Feather name='share-2' size={18} color={'#EC2E81'} />
          </TouchableOpacity>
        </View>

        {/* Meta chips under title */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 6,
          }}
        >
          {/* Date range chip */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Feather name='calendar' size={14} color={'#FFFFFF'} />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 13,
                fontFamily: 'SpaceGrotesk-Medium',
                marginLeft: 6,
              }}
            >
              {formatDateRangeShort(event.starts_at, event.ends_at)}
            </Text>
          </View>

          {/* Time chip */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Feather name='clock' size={14} color={'#FFFFFF'} />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 13,
                fontFamily: 'SpaceGrotesk-Medium',
                marginLeft: 6,
              }}
            >
              {formatTimeRangeShort(event.starts_at, event.ends_at)}
            </Text>
          </View>

          {/* Location chip */}
          {event.location ? (
            <TouchableOpacity
              onPress={handleMapPress}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                maxWidth: '100%',
              }}
            >
              <Feather name='map-pin' size={14} color={'#FFFFFF'} />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontFamily: 'SpaceGrotesk-Medium',
                  marginLeft: 6,
                }}
              >
                {event.location}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Description (truncated with expand/collapse + fade) */}
        {event.description ? (
          <View style={{ marginBottom: 12 }}>
            <View style={{ position: 'relative' }}>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 15,
                  lineHeight: 22,
                  fontFamily: 'SpaceGrotesk-Regular',
                }}
              >
                {isDescriptionExpanded
                  ? event.description
                  : `${event.description.slice(0, 150)}${
                      event.description.length > 150 ? '...' : ''
                    }`}
              </Text>

              {!isDescriptionExpanded && event.description.length > 150 ? (
                <LinearGradient
                  pointerEvents='none'
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -2,
                    height: 36,
                  }}
                />
              ) : null}
            </View>

            {event.description.length > 150 ? (
              <TouchableOpacity
                onPress={handleDescriptionToggle}
                activeOpacity={0.7}
                style={{
                  marginTop: 8,
                  alignSelf: 'flex-start',
                  paddingVertical: 4,
                  paddingHorizontal: 6,
                  borderRadius: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      color: '#2066DF',
                      fontFamily: 'SpaceGrotesk-SemiBold',
                      fontSize: 14,
                      marginRight: 4,
                    }}
                  >
                    {isDescriptionExpanded ? 'Zwiń' : 'Rozwiń'}
                  </Text>
                  <Feather
                    name={isDescriptionExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={'#2066DF'}
                  />
                </View>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Improved CTA Button */}
        <TouchableOpacity
          onPress={handleEventLinkPress}
          activeOpacity={0.8}
          style={{
            marginTop: 4,
          }}
        >
          <LinearGradient
            colors={['rgba(32, 102, 223, 0.2)', 'rgba(236, 46, 129, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 14,
              padding: 1,
            }}
          >
            <View
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: 13,
                paddingVertical: 10,
                paddingHorizontal: 20,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Feather name='arrow-right' size={18} color={'#FFFFFF'} />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontFamily: 'SpaceGrotesk-SemiBold',
                    fontSize: 16,
                    letterSpacing: 0.5,
                  }}
                >
                  Odwiedź stronę
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
