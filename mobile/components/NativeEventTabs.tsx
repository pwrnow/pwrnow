/**
 * Native Event Tabs Component
 *
 * A native-feeling tab navigation component for event details using react-native-tab-view.
 * Features:
 * - Native swipe gestures between tabs
 * - Smooth animations with haptic feedback
 * - Lazy loading for performance
 * - Platform-appropriate styling
 * - Proper keyboard navigation support
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { t } from '../lib/i18n';
import { Event } from '../types';

// Import existing components
import PostsList from './PostsList';
import ScheduleList from './ScheduleList';
import WeekDaySelector from './WeekDaySelector';
import EventHeroImage from './EventHeroImage';
import OrganizationHeader from './OrganizationHeader';
import EventMetaCard from './EventMetaCard';
import EventDescription from './EventDescription';
import VisitPageButton from './VisitPageButton';

type TabType = 'details' | 'posts' | 'schedule';

interface Route {
  key: TabType;
  title: string;
  icon: keyof typeof Feather.glyphMap;
}

interface DetailsSceneProps {
  event: Event;
  onCalendarPress?: () => void;
  onMapPress?: () => void;
  onExternalLink?: () => void;
  ctaAnimatedStyle?: any;
}

interface PostsSceneProps {
  event: Event;
  isDark: boolean;
  iconPrimary: string;
  dummyPosts: any[];
  formatPostTime: (timestamp: string) => string;
  getInitials: (name: string) => string;
  organizationImageUrl?: string;
  onImagePress: (images: string[], initialIndex: number) => void;
}

interface ScheduleSceneProps {
  selectedDay: string;
  setSelectedDay: (dayId: string) => void;
  eventDays: any[];
  itemsByDay: Record<string, any[]>;
  isDark: boolean;
  scheduleScrollRef: any;
}

interface Props {
  event: Event;
  detailsProps: DetailsSceneProps;
  postsProps: PostsSceneProps;
  scheduleProps: ScheduleSceneProps;
}

const routes: Route[] = [
  { key: 'details', title: t('details'), icon: 'info' },
  { key: 'posts', title: t('posts'), icon: 'message-circle' },
  { key: 'schedule', title: t('schedule'), icon: 'calendar' },
];

// Details Scene Component
const DetailsScene: React.FC<{ detailsProps: DetailsSceneProps }> = ({
  detailsProps,
}) => {
  const {
    event,
    onCalendarPress,
    onMapPress,
    onExternalLink,
    ctaAnimatedStyle,
  } = detailsProps;

  return (
    <Animated.ScrollView
      entering={FadeIn.duration(200)}
      showsVerticalScrollIndicator={false}
      className='flex-1'
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View className='space-y-4'>
        {/* Event Image */}
        {event.image_url && <EventHeroImage imageUrl={event.image_url} />}

        {/* Organization Header */}
        <OrganizationHeader
          organization={event.organization}
          categoryName={event.category.name}
        />

        {/* Event Details Section */}
        <EventMetaCard
          startsAt={event.starts_at}
          endsAt={event.ends_at}
          location={event.location}
          onCalendarPress={onCalendarPress}
          onMapPress={onMapPress}
        />

        {/* Event Description */}
        <EventDescription description={event.description} />

        {/* Visit Page Button */}
        {event.url && onExternalLink && (
          <VisitPageButton
            onPress={onExternalLink}
            animatedStyle={ctaAnimatedStyle}
          />
        )}
      </View>
    </Animated.ScrollView>
  );
};

// Posts Scene Component
const PostsScene: React.FC<{ postsProps: PostsSceneProps }> = ({
  postsProps,
}) => {
  const {
    dummyPosts,
    formatPostTime,
    getInitials,
    organizationImageUrl,
    onImagePress,
  } = postsProps;

  return (
    <Animated.View entering={FadeIn.duration(200)} className='flex-1 mt-3 px-4'>
      <PostsList
        posts={dummyPosts}
        formatPostTime={formatPostTime}
        getInitials={getInitials}
        organizationImageUrl={organizationImageUrl}
        onImagePress={onImagePress}
      />
    </Animated.View>
  );
};

// Optimized Schedule List Component without animations on day change
const OptimizedScheduleList: React.FC<{
  dayId: string;
  items: any[];
  isDark: boolean;
}> = React.memo(({ dayId, items, isDark }) => {
  return (
    <View className='space-y-2 px-4'>
      {items.map((item, index) => {
        const isEventPast = (dayId: string, time: string, endTime: string) => {
          const now = new Date();
          const eventDateTime = new Date(`${dayId}T${endTime}:00`);
          return eventDateTime < now;
        };

        const isEventCurrent = (
          dayId: string,
          time: string,
          endTime: string
        ) => {
          const now = new Date();
          const startDateTime = new Date(`${dayId}T${time}:00`);
          const endDateTime = new Date(`${dayId}T${endTime}:00`);
          return now >= startDateTime && now <= endDateTime;
        };

        const past = isEventPast(dayId, item.time, item.endTime);
        const current = isEventCurrent(dayId, item.time, item.endTime);

        return (
          <View
            key={`${dayId}-${item.id}`}
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
                {item.speaker && (
                  <View className='flex-row items-center'>
                    <Feather
                      name='user'
                      size={10}
                      color={
                        past
                          ? isDark
                            ? '#FFFFFF40'
                            : '#00000040'
                          : isDark
                          ? '#FFFFFF80'
                          : '#00000080'
                      }
                    />
                    <Text
                      className={`font-groteskMedium text-xs ml-1.5 ${
                        past
                          ? 'text-black/40 dark:text-white/40'
                          : 'text-black/70 dark:text-white/70'
                      }`}
                    >
                      {item.speaker}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
});

// Optimized Week Day Selector without entrance animation
const OptimizedWeekDaySelector: React.FC<{
  selectedDay: string;
  onDaySelect: (dayId: string) => void;
  days: any[];
}> = React.memo(({ selectedDay, onDaySelect, days }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleDayPress = async (dayId: string) => {
    await Haptics.selectionAsync();
    onDaySelect(dayId);
  };

  return (
    <View className='mb-4'>
      <Animated.ScrollView
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
      </Animated.ScrollView>
    </View>
  );
});

// Schedule Scene Component
const ScheduleScene: React.FC<{ scheduleProps: ScheduleSceneProps }> = ({
  scheduleProps,
}) => {
  const {
    selectedDay,
    setSelectedDay,
    eventDays,
    itemsByDay,
    isDark,
    scheduleScrollRef,
  } = scheduleProps;

  return (
    <View className='flex-1'>
      {eventDays.length > 1 && (
        <View className='mt-3 px-4'>
          <OptimizedWeekDaySelector
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
            days={eventDays}
          />
        </View>
      )}

      <Animated.ScrollView
        ref={scheduleScrollRef}
        showsVerticalScrollIndicator={false}
        className='flex-1'
        contentContainerStyle={{
          paddingBottom: 24,
          paddingTop: eventDays.length > 1 ? 0 : 16,
        }}
      >
        <OptimizedScheduleList
          dayId={selectedDay}
          items={itemsByDay[selectedDay] || []}
          isDark={isDark}
        />
      </Animated.ScrollView>
    </View>
  );
};

export const NativeEventTabs: React.FC<Props> = ({
  event,
  detailsProps,
  postsProps,
  scheduleProps,
}) => {
  const layout = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [index, setIndex] = useState(0);

  // Create scene map
  const renderScene = SceneMap({
    details: () => <DetailsScene detailsProps={detailsProps} />,
    posts: () => <PostsScene postsProps={postsProps} />,
    schedule: () => <ScheduleScene scheduleProps={scheduleProps} />,
  });

  // Custom Tab Bar Component
  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{
        backgroundColor: isDark ? '#FFFFFF' : '#000000',
        height: 3,
        borderRadius: 1.5,
        marginBottom: 1,
      }}
      style={{
        backgroundColor: isDark ? '#000000' : '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: isDark
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 0, 0, 0.1)',
        elevation: 0,
        shadowOpacity: 0,
      }}
      tabStyle={{
        flex: 1,
        paddingVertical: 12,
      }}
      renderLabel={({ route, focused }: { route: any; focused: boolean }) => {
        const routeTyped = route as Route;
        return (
          <View className='flex-row items-center'>
            <Feather
              name={routeTyped.icon}
              size={16}
              color={
                focused
                  ? isDark
                    ? '#FFFFFF'
                    : '#000000'
                  : isDark
                  ? '#FFFFFF80'
                  : '#00000080'
              }
            />
            <Text
              className={`ml-2 font-groteskMedium text-sm ${
                focused
                  ? 'text-black dark:text-white'
                  : 'text-black/50 dark:text-white/50'
              }`}
            >
              {routeTyped.title}
            </Text>
          </View>
        );
      }}
      pressColor={isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}
      onTabPress={({ route }) => {
        Haptics.selectionAsync();
      }}
    />
  );

  return (
    <View className='flex-1'>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={(newIndex) => {
          if (newIndex !== index) {
            Haptics.selectionAsync();
          }
          setIndex(newIndex);
        }}
        initialLayout={{ width: layout.width }}
        swipeEnabled={true}
        animationEnabled={true}
        lazy={true}
        lazyPreloadDistance={1}
        style={{
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
        }}
      />
    </View>
  );
};

export default NativeEventTabs;
