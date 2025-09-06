import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { t } from '../lib/i18n';
import { useThemeColors } from '../hooks/useThemeColors';

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  description: string | null;
  duration: string;
  endTime: string;
}

interface Props {
  dayId: string; // YYYY-MM-DD
  items: ScheduleItem[];
}

const isEventPast = (dayId: string, time: string, endTime: string) => {
  const now = new Date();
  const eventDateTime = new Date(`${dayId}T${endTime}:00`);
  return eventDateTime < now;
};

const isEventCurrent = (dayId: string, time: string, endTime: string) => {
  const now = new Date();
  const startDateTime = new Date(`${dayId}T${time}:00`);
  const endDateTime = new Date(`${dayId}T${endTime}:00`);
  return now >= startDateTime && now <= endDateTime;
};

const ScheduleListComponent: React.FC<Props> = ({ dayId, items }) => {
  const { colors, isDark } = useThemeColors();
  // Show empty state if no items for this day
  if (items.length === 0) {
    return (
      <View className='flex-1 justify-center items-center py-12'>
        <View className='items-center'>
          <View
            className='w-16 h-16 rounded-full items-center justify-center mb-4'
            style={{ backgroundColor: colors.muted }}
          >
            <Feather name='calendar' size={24} color={colors.mutedForeground} />
          </View>
          <Text
            className='font-groteskSemibold text-lg mb-2'
            style={{ color: colors.foreground }}
          >
            {t('noScheduleItems')}
          </Text>
          <Text
            className='font-grotesk text-sm text-center px-8'
            style={{ color: colors.mutedForeground }}
          >
            {t('noScheduleItemsDescription')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className='space-y-2'>
      {items.map((item, index) => {
        const past = isEventPast(dayId, item.time, item.endTime);
        const current = isEventCurrent(dayId, item.time, item.endTime);

        return (
          <Animated.View
            key={item.id}
            entering={FadeInDown.duration(200).delay(index * 40)}
            className='rounded-xl mb-2 p-3 border relative'
            style={{
              backgroundColor: current
                ? `${colors.accent}10`
                : past
                ? colors.muted
                : colors.card,
              borderColor: current ? `${colors.accent}30` : colors.border,
              borderWidth: 1,
              ...(!current && !past && !isDark
                ? {
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 2,
                  }
                : {}),
            }}
          >
            {current && (
              <View
                className='absolute -left-0.5 top-4 w-1 h-6 rounded-full'
                style={{ backgroundColor: colors.accent }}
              />
            )}

            <View className='flex-row'>
              <View className='w-16 mr-3'>
                <View
                  className='rounded-lg px-2 py-1.5 border'
                  style={{
                    backgroundColor: current
                      ? colors.accent
                      : past
                      ? colors.muted
                      : `${colors.accent}15`,
                    borderColor: current
                      ? colors.accent
                      : past
                      ? colors.border
                      : `${colors.accent}30`,
                    borderWidth: 1,
                  }}
                >
                  <Text
                    className='font-groteskSemibold text-xs text-center'
                    style={{
                      color: current
                        ? colors.accentForeground
                        : past
                        ? colors.mutedForeground
                        : colors.accent,
                    }}
                  >
                    {item.time}
                  </Text>
                </View>
                <Text
                  className='font-grotesk text-xs text-center mt-1'
                  style={{
                    color: past
                      ? colors.mutedForeground
                      : colors.mutedForeground,
                  }}
                >
                  {item.duration}
                </Text>
              </View>

              <View className='flex-1'>
                <View className='flex-row items-start justify-between mb-1.5'>
                  <Text
                    className='font-groteskSemibold text-sm flex-1 leading-5'
                    style={{
                      color: current
                        ? colors.accent
                        : past
                        ? colors.mutedForeground
                        : colors.foreground,
                    }}
                  >
                    {item.title}
                  </Text>
                  {current && (
                    <View
                      className='ml-2 px-2 py-0.5 rounded-full'
                      style={{ backgroundColor: colors.accent }}
                    >
                      <Text
                        className='text-xs font-groteskSemibold'
                        style={{ color: colors.accentForeground }}
                      >
                        {t('live')}
                      </Text>
                    </View>
                  )}
                  {past && (
                    <View className='ml-2'>
                      <Feather
                        name='check-circle'
                        size={14}
                        color={colors.accent}
                      />
                    </View>
                  )}
                </View>
                <Text
                  className='font-grotesk text-xs leading-4 mb-1.5'
                  style={{
                    color: past
                      ? colors.mutedForeground
                      : colors.mutedForeground,
                  }}
                >
                  {item.description}
                </Text>
                {/* Speaker field removed */}
              </View>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
};

export const ScheduleList = React.memo(ScheduleListComponent);

export default ScheduleList;
