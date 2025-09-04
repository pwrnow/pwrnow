import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { t } from '../lib/i18n';
import { formatDateRangeShort, formatTimeRangeShort } from '../lib/format';
import { useCalendar } from '../hooks/useCalendar';
import { Event } from '../types';
import { useThemeColors } from '../hooks/useThemeColors';

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
  const { colors } = useThemeColors();
  const { handleAddToCalendar } = useCalendar({ event });

  return (
    <View className='mx-4 mt-3 mb-3'>
      <View
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className='border rounded-xl p-4'
      >
        <Text
          style={{ color: colors.foreground }}
          className='font-groteskSemibold text-lg mb-3'
        >
          {t('eventDetails')}
        </Text>

        <View className='space-y-4'>
          <TouchableOpacity
            onPress={handleAddToCalendar}
            className='flex-row items-center mb-2'
            activeOpacity={0.7}
          >
            <View
              style={{ backgroundColor: colors.primary + '15' }}
              className='w-8 h-8 rounded-full items-center justify-center mr-3'
            >
              <Feather name='calendar' size={14} color={colors.primary} />
            </View>
            <View className='flex-1'>
              <Text
                style={{ color: colors.foreground }}
                className='font-groteskSemibold text-base'
              >
                {formatDateRangeShort(startsAt, endsAt)}
              </Text>
            </View>
            <Feather name='plus' size={16} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAddToCalendar}
            className='flex-row items-center mb-2'
            activeOpacity={0.7}
          >
            <View
              style={{ backgroundColor: colors.primary + '15' }}
              className='w-8 h-8 rounded-full items-center justify-center mr-3'
            >
              <Feather name='clock' size={14} color={colors.primary} />
            </View>
            <View className='flex-1'>
              <Text
                style={{ color: colors.foreground }}
                className='font-groteskSemibold text-base'
              >
                {formatTimeRangeShort(startsAt, endsAt)}
              </Text>
            </View>
            <Feather name='plus' size={16} color={colors.primary} />
          </TouchableOpacity>

          {location ? (
            <TouchableOpacity
              onPress={onMapPress}
              className='flex-row items-center'
              activeOpacity={0.7}
            >
              <View
                style={{ backgroundColor: colors.accent + '15' }}
                className='w-8 h-8 rounded-full items-center justify-center mr-3'
              >
                <Feather name='map-pin' size={14} color={colors.accent} />
              </View>
              <View className='flex-1'>
                <Text
                  style={{ color: colors.foreground }}
                  className='font-groteskSemibold text-base'
                  numberOfLines={2}
                >
                  {location}
                </Text>
              </View>
              <Feather name='external-link' size={16} color={colors.accent} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default EventMetaCard;
