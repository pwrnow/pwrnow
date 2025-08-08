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
    <View className='mb-0 bg-black'>
      {/* Header: org + category */}
      <View className='px-4 pt-4 pb-3'>
        <View className='flex-row items-center gap-3'>
          <View className='w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/15 justify-center items-center'>
            {event.organization.image_url ? (
              <Image
                source={{ uri: event.organization.image_url }}
                className='w-full h-full'
                resizeMode='cover'
              />
            ) : (
              <Text className='text-white font-semibold text-sm'>
                {getInitials(event.organization.name)}
              </Text>
            )}
          </View>
          <View className='flex-1'>
            <Text
              className='text-white font-semibold text-sm leading-4'
              numberOfLines={1}
            >
              {event.organization.name}
            </Text>
            <Text className='text-white/65 text-xs leading-4 mt-[1px]'>
              {event.category.name}
            </Text>
          </View>
          {event.is_new ? (
            <View className='px-2.5 py-1.5 rounded-xl bg-accentPink/15 border border-accentPink/30'>
              <Text className='text-accentPink text-[11px] font-semibold tracking-[0.5px]'>
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
              className='w-full bg-muted overflow-visible'
              style={{ aspectRatio: imageAspectRatio }}
            >
              <Image
                source={{ uri: event.image_url }}
                onLoadStart={() => setIsImageLoading(true)}
                onLoadEnd={() => setIsImageLoading(false)}
                className='w-full h-full'
                resizeMode='cover'
              />
            </View>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Content */}
      <View className='px-4 pt-4 pb-5'>
        {/* Title and Share */}
        <View className='flex-row items-start'>
          <Text
            className='text-white font-semibold text-xl leading-6 flex-1 mr-3'
            numberOfLines={3}
          >
            {event.title}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            className='bg-accentPink/12 border border-accentPink/25 rounded-lg p-2.5'
          >
            <Feather name='share-2' size={18} color={'#EC2E81'} />
          </TouchableOpacity>
        </View>

        {/* Meta chips under title */}
        <View className='flex-row flex-wrap gap-2 mb-1.5'>
          {/* Date range chip */}
          <View className='flex-row items-center py-1.5 px-2.5 rounded-full bg-white/5 border border-white/10'>
            <Feather name='calendar' size={14} color={'#FFFFFF'} />
            <Text className='text-white text-[13px] font-medium ml-1.5'>
              {formatDateRangeShort(event.starts_at, event.ends_at)}
            </Text>
          </View>

          {/* Time chip */}
          <View className='flex-row items-center py-1.5 px-2.5 rounded-full bg-white/5 border border-white/10'>
            <Feather name='clock' size={14} color={'#FFFFFF'} />
            <Text className='text-white text-[13px] font-medium ml-1.5'>
              {formatTimeRangeShort(event.starts_at, event.ends_at)}
            </Text>
          </View>

          {/* Location chip */}
          {event.location ? (
            <TouchableOpacity
              onPress={handleMapPress}
              activeOpacity={0.7}
              className='flex-row items-center py-1.5 px-2.5 rounded-full bg-white/5 border border-white/10 max-w-full'
            >
              <Feather name='map-pin' size={14} color={'#FFFFFF'} />
              <Text className='text-white text-[13px] font-medium ml-1.5'>
                {event.location}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Description (truncated with expand/collapse + fade) */}
        {event.description ? (
          <View className='mb-2'>
            <View className='relative'>
              <Text className='text-white/90 text-[15px] leading-[22px] font-sans'>
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
                    bottom: 0,
                    height: 24,
                  }}
                />
              ) : null}
            </View>

            {event.description.length > 150 ? (
              <TouchableOpacity
                onPress={handleDescriptionToggle}
                activeOpacity={0.7}
                className='mt-1 self-start py-1 px-1.5 rounded-lg'
              >
                <View className='flex-row items-center'>
                  <Text className='text-accentBlue font-semibold text-sm mr-1'>
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
          className='mt-1'
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
            <View className='bg-black/40 rounded-[13px] py-2.5 px-5 items-center justify-center border border-white/10'>
              <View className='flex-row items-center gap-2.5'>
                <Feather name='arrow-right' size={18} color={'#FFFFFF'} />
                <Text className='text-white font-semibold text-base tracking-[0.5px]'>
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
