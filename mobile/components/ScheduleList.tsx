import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { t } from '../lib/i18n';

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
  isDark: boolean;
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

const ScheduleListComponent: React.FC<Props> = ({ dayId, items, isDark }) => {
  return (
    <View className='space-y-2'>
      {items.map((item, index) => {
        const past = isEventPast(dayId, item.time, item.endTime);
        const current = isEventCurrent(dayId, item.time, item.endTime);

        return (
          <Animated.View
            key={item.id}
            entering={FadeInDown.duration(200).delay(index * 40)}
            className={`rounded-xl mb-2 p-3 border relative ${
              current
                ? 'bg-accentBlue/10 border-accentBlue/30'
                : past
                ? 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10'
                : 'bg-white dark:bg-black border-black/10 dark:border-white/10'
            }`}
            style={
              !current && !past && !isDark
                ? {
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 2,
                  }
                : undefined
            }
          >
            {current && (
              <View className='absolute -left-0.5 top-4 w-1 h-6 bg-accentBlue rounded-full' />
            )}

            <View className='flex-row'>
              <View className='w-16 mr-3'>
                <View
                  className={`rounded-lg px-2 py-1.5 border ${
                    current
                      ? 'bg-accentBlue border-accentBlue'
                      : past
                      ? 'bg-black/10 dark:bg-white/10 border-black/20 dark:border-white/20'
                      : 'bg-accentBlue/15 border-accentBlue/30'
                  }`}
                >
                  <Text
                    className={`font-groteskSemibold text-xs text-center ${
                      current
                        ? 'text-white'
                        : past
                        ? 'text-black/40 dark:text-white/40'
                        : 'text-accentBlue'
                    }`}
                  >
                    {item.time}
                  </Text>
                </View>
                <Text
                  className={`font-grotesk text-xs text-center mt-1 ${
                    past
                      ? 'text-black/30 dark:text-white/30'
                      : 'text-black/50 dark:text-white/50'
                  }`}
                >
                  {item.duration}
                </Text>
              </View>

              <View className='flex-1'>
                <View className='flex-row items-start justify-between mb-1.5'>
                  <Text
                    className={`font-groteskSemibold text-sm flex-1 leading-5 ${
                      current
                        ? 'text-accentBlue'
                        : past
                        ? 'text-black/50 dark:text-white/50'
                        : 'text-black dark:text-white'
                    }`}
                  >
                    {item.title}
                  </Text>
                  {current && (
                    <View className='ml-2 px-2 py-0.5 bg-accentBlue rounded-full'>
                      <Text className='text-white text-xs font-groteskSemibold'>
                        {t('live')}
                      </Text>
                    </View>
                  )}
                  {past && (
                    <View className='ml-2'>
                      <Feather name='check-circle' size={14} color='#10B981' />
                    </View>
                  )}
                </View>
                <Text
                  className={`font-grotesk text-xs leading-4 mb-1.5 ${
                    past
                      ? 'text-black/40 dark:text-white/40'
                      : 'text-black/75 dark:text-white/75'
                  }`}
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
