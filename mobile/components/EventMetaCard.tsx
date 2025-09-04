import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { t } from '../lib/i18n';
import { formatDateRangeShort, formatTimeRangeShort } from '../lib/format';
import { useCalendar } from '../hooks/useCalendar';
import { Event } from '../types';

interface Props {
  startsAt: string;
  endsAt: string;
  location?: string | null;
  onMapPress?: () => void;
  event?: Event | null;
}

export const EventMetaCard: React.FC<Props> = ({
  startsAt,
  endsAt,
  location,
  onMapPress,
  event,
}) => {
  const { handleAddToCalendar } = useCalendar({ event });

  return (
    <View className='mx-4 mt-3 mb-3'>
      <View className='bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4'>
        <Text className='text-black dark:text-white font-groteskSemibold text-lg mb-3'>
          {t('eventDetails')}
        </Text>

        <View className='space-y-4'>
          <TouchableOpacity
            onPress={handleAddToCalendar}
            className='flex-row items-center mb-2'
            activeOpacity={0.7}
          >
            <View className='w-8 h-8 rounded-full bg-accentBlue/15 items-center justify-center mr-3'>
              <Feather name='calendar' size={14} color='#2066DF' />
            </View>
            <View className='flex-1'>
              <Text className='text-black dark:text-white font-groteskSemibold text-base'>
                {formatDateRangeShort(startsAt, endsAt)}
              </Text>
            </View>
            <Feather name='plus' size={16} color='#2066DF' />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAddToCalendar}
            className='flex-row items-center mb-2'
            activeOpacity={0.7}
          >
            <View className='w-8 h-8 rounded-full bg-accentBlue/15 items-center justify-center mr-3'>
              <Feather name='clock' size={14} color='#2066DF' />
            </View>
            <View className='flex-1'>
              <Text className='text-black dark:text-white font-groteskSemibold text-base'>
                {formatTimeRangeShort(startsAt, endsAt)}
              </Text>
            </View>
            <Feather name='plus' size={16} color='#2066DF' />
          </TouchableOpacity>

          {location ? (
            <TouchableOpacity
              onPress={onMapPress}
              className='flex-row items-center'
              activeOpacity={0.7}
            >
              <View className='w-8 h-8 rounded-full bg-accentPink/15 items-center justify-center mr-3'>
                <Feather name='map-pin' size={14} color='#EC2E81' />
              </View>
              <View className='flex-1'>
                <Text
                  className='text-black dark:text-white font-groteskSemibold text-base'
                  numberOfLines={2}
                >
                  {location}
                </Text>
              </View>
              <Feather name='external-link' size={16} color='#EC2E81' />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default EventMetaCard;
