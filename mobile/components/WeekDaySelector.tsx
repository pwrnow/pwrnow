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
  const toLocalStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const start = toLocalStartOfDay(new Date(startDate));
  const end = toLocalStartOfDay(new Date(endDate));

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

  const days: DayOption[] = [];
  const todayLocal = toLocalStartOfDay(new Date());

  const current = new Date(start);
  while (current <= end) {
    const id = formatYMD(current);
    const isToday = current.getTime() === todayLocal.getTime();
    const isPast = current < todayLocal;

    days.push({
      id,
      date: new Date(current),
      dayName: current.toLocaleDateString(deviceLocaleTag, { weekday: 'short' }),
      dayNumber: current.getDate(),
      monthName: current.toLocaleDateString(deviceLocaleTag, { month: 'short' }),
      isPast,
      isToday,
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
};
