import React, { useState, useEffect } from 'react';
import { View, Text, useWindowDimensions, ScrollView } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { t } from '../lib/i18n';
import { useEventBySlug } from '../lib/queries';
import { formatPostTime, getInitials } from '../lib/format';

// Import existing components
import PostsList from './PostsList';
import EventScheduleTab from './EventScheduleTab';
import EventHeroImage from './EventHeroImage';
import OrganizationHeader from './OrganizationHeader';
import EventMetaCard from './EventMetaCard';
import EventDescription from './EventDescription';
import VisitPageButton from './VisitPageButton';
import EventMapTab from './EventMapTab';
import { useThemeColors } from '../hooks/useThemeColors';

type TabType = 'details' | 'posts' | 'schedule' | 'map';

interface Route {
  key: TabType;
  title: string;
  icon: keyof typeof Feather.glyphMap;
}

interface Props {
  eventSlug: string;
  posts?: any[];
  isLoadingPosts?: boolean;
  postsError?: any; // Optional since posts are now included in main event query
  eventDays: any[];
  itemsByDay: Record<string, any[]>;
  hasSchedule: boolean;
  onMapPress?: () => void;
  onExternalLink?: () => void;
  onImagePress: (images: string[], initialIndex: number) => void;
  ctaAnimatedStyle?: any;
}

// routes are built dynamically in the component based on data

// Details Scene Component
const DetailsScene: React.FC<{
  eventSlug: string;
  onMapPress?: () => void;
  onExternalLink?: () => void;
  ctaAnimatedStyle?: any;
}> = React.memo(
  ({ eventSlug, onMapPress, onExternalLink, ctaAnimatedStyle }) => {
    const { colors } = useThemeColors();
    const { data: event, isLoading, error } = useEventBySlug(eventSlug);

    if (isLoading) {
      return (
        <View className='flex-1 justify-center items-center'>
          <Text
            style={{ color: colors.mutedForeground }}
            className='font-grotesk text-sm'
          >
            {t('loadingEvent')}
          </Text>
        </View>
      );
    }

    if (error || !event) {
      return (
        <View className='flex-1 justify-center items-center px-6'>
          <Text
            style={{ color: colors.mutedForeground }}
            className='font-grotesk text-sm text-center'
          >
            {t('failedToLoadEvent')}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        className='flex-1'
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className='space-y-4'>
          {/* Event Image */}
          {event.image_url && (
            <EventHeroImage
              imageUrl={event.image_url}
              aspectRatio={event.aspect_ratio}
            />
          )}

          {/* Organization Header */}
          <OrganizationHeader
            organization={event.organization}
            categoryName={event.category?.name || 'Uncategorized'}
          />

          {/* Event Details Section */}
          <EventMetaCard
            startsAt={event.starts_at}
            endsAt={event.ends_at}
            location={event.location}
            onMapPress={onMapPress}
            event={event}
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
      </ScrollView>
    );
  }
);

// Posts Scene Component
const PostsScene: React.FC<{
  eventSlug: string;
  posts?: any[];
  isLoadingPosts?: boolean;
  postsError?: any;
  onImagePress: (images: string[], initialIndex: number) => void;
}> = React.memo(
  ({ eventSlug, posts, isLoadingPosts, postsError, onImagePress }) => {
    const { colors } = useThemeColors();
    const { data: event } = useEventBySlug(eventSlug);
    const { postId } = useLocalSearchParams();

    if (isLoadingPosts) {
      return (
        <View className='flex-1 justify-center items-center'>
          <Text
            style={{ color: colors.mutedForeground }}
            className='font-grotesk text-sm'
          >
            {t('loadingPosts')}
          </Text>
        </View>
      );
    }

    if (postsError) {
      return (
        <View className='flex-1 justify-center items-center px-6'>
          <Text
            style={{ color: colors.mutedForeground }}
            className='font-grotesk text-sm text-center'
          >
            {t('failedToLoadPosts')}
          </Text>
        </View>
      );
    }

    if (!posts || posts.length === 0) {
      return (
        <View className='flex-1 justify-center items-center px-6'>
          <Text
            style={{ color: colors.mutedForeground }}
            className='font-grotesk text-sm text-center'
          >
            {t('noPosts')}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        className='flex-1'
        contentContainerStyle={{
          paddingTop: 12,
          paddingHorizontal: 16,
          paddingBottom: 24,
        }}
      >
        <PostsList
          posts={posts}
          formatPostTime={formatPostTime}
          getInitials={getInitials}
          organizationImageUrl={event?.organization.image_url || undefined}
          onImagePress={onImagePress}
          focusPostId={typeof postId === 'string' ? postId : undefined}
        />
      </ScrollView>
    );
  }
);

// Schedule Scene Component
const ScheduleScene: React.FC<{
  eventDays: any[];
  itemsByDay: Record<string, any[]>;
}> = React.memo(({ eventDays, itemsByDay }) => {
  return <EventScheduleTab eventDays={eventDays} itemsByDay={itemsByDay} />;
});

// Map Scene Component
const MapScene: React.FC<{
  eventSlug: string;
}> = React.memo(({ eventSlug }) => {
  const { data: event, isLoading, error } = useEventBySlug(eventSlug);

  return (
    <EventMapTab
      eventMap={event?.event_map || null}
      isLoading={isLoading}
      error={error}
    />
  );
});

export const SimpleEventTabs: React.FC<Props> = React.memo(
  ({
    eventSlug,
    posts,
    isLoadingPosts,
    postsError,
    eventDays,
    itemsByDay,
    hasSchedule,
    onMapPress,
    onExternalLink,
    onImagePress,
    ctaAnimatedStyle,
  }) => {
    const layout = useWindowDimensions();
    const { colors } = useThemeColors();
    const { tab } = useLocalSearchParams();
    const { data: event } = useEventBySlug(eventSlug);

    // Check if event has a map with active locations
    const hasMap =
      event?.event_map &&
      event.event_map.is_active &&
      event.event_map.locations?.some((loc) => loc.is_active);

    // Always show schedule tab for events - even if no schedule items exist
    // This allows users to see event days and potentially add schedule items
    const routes: Route[] = [
      { key: 'details', title: t('details'), icon: 'info' },
      { key: 'posts', title: t('posts'), icon: 'message-circle' },
      ...(hasSchedule
        ? ([
            { key: 'schedule', title: t('schedule'), icon: 'calendar' },
          ] as Route[])
        : ([] as Route[])),
      ...(hasMap
        ? ([{ key: 'map', title: t('map'), icon: 'map-pin' }] as Route[])
        : ([] as Route[])),
    ];

    const [index, setIndex] = useState(() => {
      // Initialize based on URL tab parameter and availability
      if (tab === 'posts') return 1;
      if (tab === 'schedule' && hasSchedule)
        return routes.findIndex((r) => r.key === 'schedule');
      if (tab === 'map' && hasMap)
        return routes.findIndex((r) => r.key === 'map');
      return 0;
    });

    // Sync index with URL tab parameter changes
    useEffect(() => {
      if (tab === 'posts') setIndex(1);
      else if (tab === 'schedule' && hasSchedule)
        setIndex(routes.findIndex((r) => r.key === 'schedule'));
      else if (tab === 'map' && hasMap)
        setIndex(routes.findIndex((r) => r.key === 'map'));
      else setIndex(0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, hasSchedule, hasMap]);

    // Create scene map
    const renderScene = ({ route }: any) => {
      switch (route.key as TabType) {
        case 'details':
          return (
            <DetailsScene
              eventSlug={eventSlug}
              onMapPress={onMapPress}
              onExternalLink={onExternalLink}
              ctaAnimatedStyle={ctaAnimatedStyle}
            />
          );
        case 'posts':
          return (
            <PostsScene
              eventSlug={eventSlug}
              posts={posts}
              isLoadingPosts={isLoadingPosts}
              postsError={postsError}
              onImagePress={onImagePress}
            />
          );
        case 'schedule':
          return (
            <ScheduleScene eventDays={eventDays} itemsByDay={itemsByDay} />
          );
        case 'map':
          return <MapScene eventSlug={eventSlug} />;
        default:
          return null;
      }
    };

    // Tab Bar Component
    const renderTabBar = (props: any) => (
      <TabBar
        {...props}
        indicatorStyle={{
          backgroundColor: colors.primary,
          height: 2,
        }}
        style={{
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        }}
        tabStyle={{
          flex: 1,
          paddingVertical: 16,
        }}
        pressColor={colors.primary + '20'}
        activeColor={colors.foreground}
        inactiveColor={colors.mutedForeground}
        onTabPress={() => {
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
          lazy={false}
          style={{
            backgroundColor: colors.background,
          }}
        />
      </View>
    );
  }
);

export default SimpleEventTabs;
