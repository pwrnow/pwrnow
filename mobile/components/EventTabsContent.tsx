import React from 'react';
import { View, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Event } from '../types';
import PostsList from './PostsList';
import ScheduleList from './ScheduleList';
import WeekDaySelector from './WeekDaySelector';

type TabType = 'details' | 'posts' | 'schedule';

interface PostsProps {
  event: Event;
  isDark: boolean;
  iconPrimary: string;
  dummyPosts: any[];
  formatPostTime: (timestamp: string) => string;
  getInitials: (name: string) => string;
  organizationImageUrl?: string;
  onImagePress: (images: string[], initialIndex: number) => void;
}

interface ScheduleProps {
  selectedDay: string;
  setSelectedDay: (dayId: string) => void;
  eventDays: any[];
  itemsByDay: Record<string, any[]>;
  isDark: boolean;
  scheduleScrollRef: any;
}

interface Props {
  activeTab: TabType;
  postsProps: PostsProps;
  scheduleProps: ScheduleProps;
}

export const EventTabsContent: React.FC<Props> = ({
  activeTab,
  postsProps,
  scheduleProps,
}) => {
  if (activeTab === 'posts') {
    const {
      event,
      dummyPosts,
      formatPostTime,
      getInitials,
      organizationImageUrl,
      onImagePress,
    } = postsProps;
    return (
      <View className='mx-4 mt-3'>
        <PostsList
          posts={dummyPosts}
          formatPostTime={formatPostTime}
          getInitials={getInitials}
          organizationImageUrl={organizationImageUrl}
          onImagePress={onImagePress}
        />
      </View>
    );
  }

  if (activeTab === 'schedule') {
    const {
      selectedDay,
      setSelectedDay,
      eventDays,
      itemsByDay,
      isDark,
      scheduleScrollRef,
    } = scheduleProps;
    return (
      <Animated.View
        key='schedule'
        entering={FadeInDown.duration(300)}
        className='flex-1'
      >
        {eventDays.length > 1 && (
          <View className='mx-4 mt-3'>
            <WeekDaySelector
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
              days={eventDays}
            />
          </View>
        )}

        <ScrollView
          ref={scheduleScrollRef}
          showsVerticalScrollIndicator={false}
          className='flex-1'
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 24,
            paddingTop: eventDays.length > 1 ? 0 : 16,
          }}
        >
          <ScheduleList
            dayId={selectedDay}
            items={itemsByDay[selectedDay] || []}
            isDark={isDark}
          />
        </ScrollView>
      </Animated.View>
    );
  }

  return null as any;
};

export default EventTabsContent;
