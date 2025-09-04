import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { deviceLocaleTag } from '../lib/i18n';
import { useThemeColors } from '../hooks/useThemeColors';

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

const WeekDaySelectorComponent: React.FC<WeekDaySelectorProps> = ({
  selectedDay,
  onDaySelect,
  days,
}) => {
  const { colors } = useThemeColors();

  const handleDayPress = useCallback(
    async (dayId: string) => {
      await Haptics.selectionAsync();
      onDaySelect(dayId);
    },
    [onDaySelect]
  );

  return (
    <View className='mb-4'>
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
              style={{
                backgroundColor: isSelected
                  ? isToday
                    ? colors.primary
                    : isPast
                    ? colors.muted
                    : colors.primary
                  : isPast
                  ? colors.muted
                  : isToday
                  ? colors.primary + '10'
                  : colors.muted,
                borderColor: isSelected
                  ? isToday
                    ? colors.primary
                    : isPast
                    ? colors.border
                    : colors.primary
                  : isPast
                  ? colors.border
                  : isToday
                  ? colors.primary + '30'
                  : colors.border,
              }}
              className='mr-3 px-4 py-3 rounded-xl items-center min-w-[80px] border'
              activeOpacity={0.7}
            >
              {isToday && !isSelected && (
                <View
                  style={{ backgroundColor: colors.primary }}
                  className='absolute -top-1 -right-1 w-3 h-3 rounded-full'
                />
              )}

              <Text
                style={{
                  color: isSelected
                    ? colors.primaryForeground
                    : isPast
                    ? colors.mutedForeground
                    : isToday
                    ? colors.primary
                    : colors.mutedForeground,
                }}
                className='text-xs font-groteskMedium mb-1'
              >
                {day.dayName}
              </Text>
              <Text
                style={{
                  color: isSelected
                    ? colors.primaryForeground
                    : isPast
                    ? colors.mutedForeground
                    : isToday
                    ? colors.primary
                    : colors.foreground,
                }}
                className='text-lg font-groteskSemibold'
              >
                {day.dayNumber}
              </Text>
              <Text
                style={{
                  color: isSelected
                    ? colors.primaryForeground
                    : isPast
                    ? colors.mutedForeground
                    : isToday
                    ? colors.primary
                    : colors.mutedForeground,
                }}
                className='text-xs font-grotesk'
              >
                {day.monthName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default React.memo(WeekDaySelectorComponent);

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
