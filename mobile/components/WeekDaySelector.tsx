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
      className='px-4 pb-3'
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
        className='flex-row'
      >
        {days.map((day, index) => (
          <TouchableOpacity
            key={day.id}
            onPress={() => handleDayPress(day.id)}
            className={`mr-3 px-4 py-3 rounded-xl items-center min-w-[70px] ${
              selectedDay === day.id
                ? 'bg-accentBlue'
                : 'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-xs font-groteskMedium mb-1 ${
                selectedDay === day.id
                  ? 'text-white'
                  : 'text-black/60 dark:text-white/60'
              }`}
            >
              {day.dayName}
            </Text>
            <Text
              className={`text-lg font-groteskSemibold ${
                selectedDay === day.id
                  ? 'text-white'
                  : 'text-black dark:text-white'
              }`}
            >
              {day.dayNumber}
            </Text>
            <Text
              className={`text-xs font-grotesk ${
                selectedDay === day.id
                  ? 'text-white/80'
                  : 'text-black/50 dark:text-white/50'
              }`}
            >
              {day.monthName}
            </Text>
          </TouchableOpacity>
        ))}
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

  const current = new Date(start);

  while (current <= end) {
    const locale = deviceLocaleTag;

    days.push({
      id: current.toISOString().split('T')[0], // YYYY-MM-DD format
      date: new Date(current),
      dayName: current.toLocaleDateString(locale, { weekday: 'short' }),
      dayNumber: current.getDate(),
      monthName: current.toLocaleDateString(locale, { month: 'short' }),
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
};
