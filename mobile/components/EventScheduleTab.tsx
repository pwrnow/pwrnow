import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { t } from '../lib/i18n';
import WeekDaySelector from './WeekDaySelector';
import ScheduleList from './ScheduleList';

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  description: string;
  speaker: string | null;
  duration: string;
  endTime: string;
}

interface DayOption {
  id: string;
  date: Date;
  dayName: string;
  dayNumber: number;
  monthName: string;
  isPast?: boolean;
  isToday?: boolean;
}

interface EventScheduleTabProps {
  eventDays: DayOption[];
  itemsByDay: Record<string, ScheduleItem[]>;
}

// Memoized WeekDaySelector to prevent re-renders when only selectedDay changes
const MemoizedWeekDaySelector = React.memo(WeekDaySelector);

// Memoized ScheduleList to prevent re-renders when only dayId changes
const MemoizedScheduleList = React.memo(ScheduleList);

export default function EventScheduleTab({
  eventDays,
  itemsByDay,
}: EventScheduleTabProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Internal state for selected day - automatically determines the best day to show
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    // Try to select today if it's within the event dates, otherwise select the first day
    const todayOption = eventDays.find((day) => day.isToday);
    return todayOption ? todayOption.id : eventDays[0]?.id || '';
  });

  // Memoized day selection handler to prevent unnecessary re-renders
  const handleDaySelect = useCallback((dayId: string) => {
    setSelectedDay(dayId);
  }, []);

  // Memoized schedule items for the selected day
  const currentDayItems = useMemo(() => {
    return itemsByDay[selectedDay] || [];
  }, [itemsByDay, selectedDay]);

  // Memoized eventDays to prevent unnecessary re-renders of WeekDaySelector
  const memoizedEventDays = useMemo(() => eventDays, [eventDays]);

  // Only show day selector if there are multiple days
  const shouldShowDaySelector = eventDays.length > 1;

  return (
    <View className='flex-1'>
      {/* Day Selector - only re-renders when eventDays change, not when selectedDay changes */}
      {shouldShowDaySelector && (
        <Animated.View
          entering={FadeInDown.duration(300).delay(100)}
          className='mt-3 px-4'
        >
          <MemoizedWeekDaySelector
            selectedDay={selectedDay}
            onDaySelect={handleDaySelect}
            days={memoizedEventDays}
          />
        </Animated.View>
      )}

      {/* Schedule List - only re-renders when items or selectedDay changes */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className='flex-1'
        contentContainerStyle={{
          paddingBottom: 24,
          paddingTop: shouldShowDaySelector ? 0 : 16,
          paddingHorizontal: 16,
        }}
      >
        <MemoizedScheduleList
          dayId={selectedDay}
          items={currentDayItems}
          isDark={isDark}
        />
      </ScrollView>
    </View>
  );
}
