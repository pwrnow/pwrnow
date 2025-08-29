import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { t, deviceLocaleTag } from '../lib/i18n';

interface DayOption {
  id: string;
  date: Date;
  dayName: string;
  dayNumber: number;
  monthName: string;
  isPast?: boolean;
  isToday?: boolean;
}

interface WeekDaySelectorProps {
  selectedDay: string;
  onDaySelect: (dayId: string) => void;
  days: DayOption[];
}

export default function WeekDaySelector({
  selectedDay,
  onDaySelect,
  days,
}: WeekDaySelectorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleDayPress = async (dayId: string) => {
    await Haptics.selectionAsync();
    onDaySelect(dayId);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(100)}
      className='mb-4'
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        className='flex-row'
      >
        {days.map((day, index) => {
          const isSelected = selectedDay === day.id;
          const isPast = day.isPast;
          const isToday = day.isToday;

          return (
            <TouchableOpacity
              key={day.id}
              onPress={() => handleDayPress(day.id)}
              className={`mr-3 px-4 py-3 rounded-xl items-center min-w-[80px] border ${
                isSelected
                  ? isToday
                    ? 'bg-accentBlue border-accentBlue'
                    : isPast
                    ? 'bg-black/20 dark:bg-white/20 border-black/30 dark:border-white/30'
                    : 'bg-accentBlue border-accentBlue'
                  : isPast
                  ? 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10'
                  : isToday
                  ? 'bg-accentBlue/10 border-accentBlue/30'
                  : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10'
              }`}
              activeOpacity={0.7}
            >
              {isToday && !isSelected && (
                <View className='absolute -top-1 -right-1 w-3 h-3 bg-accentBlue rounded-full' />
              )}

              <Text
                className={`text-xs font-groteskMedium mb-1 ${
                  isSelected
                    ? 'text-white'
                    : isPast
                    ? 'text-black/40 dark:text-white/40'
                    : isToday
                    ? 'text-accentBlue'
                    : 'text-black/60 dark:text-white/60'
                }`}
              >
                {day.dayName}
              </Text>
              <Text
                className={`text-lg font-groteskSemibold ${
                  isSelected
                    ? 'text-white'
                    : isPast
                    ? 'text-black/40 dark:text-white/40'
                    : isToday
                    ? 'text-accentBlue'
                    : 'text-black dark:text-white'
                }`}
              >
                {day.dayNumber}
              </Text>
              <Text
                className={`text-xs font-grotesk ${
                  isSelected
                    ? 'text-white/80'
                    : isPast
                    ? 'text-black/30 dark:text-white/30'
                    : isToday
                    ? 'text-accentBlue/80'
                    : 'text-black/50 dark:text-white/50'
                }`}
              >
                {day.monthName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

// Helper function to generate days from an event
export const generateEventDays = (
  startDate: string,
  endDate: string
): DayOption[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days: DayOption[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const current = new Date(start);

  while (current <= end) {
    const locale = deviceLocaleTag;
    const currentStr = current.toISOString().split('T')[0];
    const currentDate = new Date(current);
    const isPast = currentDate < new Date(todayStr);
    const isToday = currentStr === todayStr;

    days.push({
      id: currentStr, // YYYY-MM-DD format
      date: new Date(current),
      dayName: current.toLocaleDateString(locale, { weekday: 'short' }),
      dayNumber: current.getDate(),
      monthName: current.toLocaleDateString(locale, { month: 'short' }),
      isPast,
      isToday,
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
};
