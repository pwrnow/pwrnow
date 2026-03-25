import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
  isStaff?: boolean;
  onVerify?: () => void;
  isRecruitmentCategory?: boolean;
}

// routes are built dynamically in the component based on data

// Details Scene Component
const DetailsScene: React.FC<{
  eventSlug: string;
  onMapPress?: () => void;
  onExternalLink?: () => void;
  ctaAnimatedStyle?: any;
  isStaff?: boolean;
  onVerify?: () => void;
  isRecruitmentCategory?: boolean;
}> = React.memo(
  ({ eventSlug, onMapPress, onExternalLink, ctaAnimatedStyle, isStaff, onVerify, isRecruitmentCategory }) => {
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
            allOrganizations={event.all_organizations}
          />

          {/* Event Details Section */}
          <EventMetaCard
            startsAt={event.starts_at}
            endsAt={event.ends_at}
            location={event.location}
            onMapPress={onMapPress}
            event={event}
            isStaff={isStaff}
            likesCount={event.likes_count}
          />

          {/* Event Description */}
          <EventDescription description={event.description} />

          {/* Verify Button for Staff Users */}
          {isStaff && event.verified === false && onVerify && (
            <View className='mx-4 mb-4'>
              <TouchableOpacity onPress={onVerify} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 14, padding: 1 }}
                >
                  <View
                    style={{
                      backgroundColor: '#10B981',
                      shadowColor: '#10B981',
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 4,
                    }}
                    className='rounded-[13px] py-2.5 px-4 items-center justify-center'
                  >
                    <View className='flex-row items-center gap-2.5'>
                      <Feather name='shield' size={18} color='white' />
                      <Text
                        style={{ color: 'white' }}
                        className='font-semibold text-base tracking-[0.5px]'
                      >
                        {t('verifyEvent')}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Visit Page Button */}
          {event.url && onExternalLink && (
            <VisitPageButton
              onPress={onExternalLink}
              animatedStyle={ctaAnimatedStyle}
              labelKey={isRecruitmentCategory ? 'applyNow' : 'visitPage'}
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
    isStaff,
    onVerify,
    isRecruitmentCategory,
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

    // For recruitment events, only show details tab
    // For other events, show all tabs
    // Memoize routes to prevent TabView from resetting on every render
    const routes: Route[] = useMemo(() => isRecruitmentCategory
      ? [{ key: 'details', title: t('details'), icon: 'info' }]
      : [
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
        ], [isRecruitmentCategory, hasSchedule, hasMap]);

    const getTargetIndex = (currentRoutes: Route[]) => {
      if (isRecruitmentCategory) return 0;
      if (tab === 'posts') return currentRoutes.findIndex((r) => r.key === 'posts');
      if (tab === 'schedule' && hasSchedule)
        return currentRoutes.findIndex((r) => r.key === 'schedule');
      if (tab === 'map' && hasMap)
        return currentRoutes.findIndex((r) => r.key === 'map');
      return 0;
    };

    const [index, setIndex] = useState(() => {
      const target = getTargetIndex(routes);
      return target >= 0 ? target : 0;
    });

    const handleIndexChange = (newIndex: number) => {
      setIndex(newIndex);
    };

    // Sync index when tab param or available routes change
    useEffect(() => {
      const target = getTargetIndex(routes);
      if (target >= 0) setIndex(target);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, hasSchedule, hasMap, isRecruitmentCategory, routes.length]);

    const renderScene = ({ route }: any) => {
      switch (route.key as TabType) {
        case 'details':
          return (
            <DetailsScene
              eventSlug={eventSlug}
              onMapPress={onMapPress}
              onExternalLink={onExternalLink}
              ctaAnimatedStyle={ctaAnimatedStyle}
              isStaff={isStaff}
              onVerify={onVerify}
              isRecruitmentCategory={isRecruitmentCategory}
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

    const renderTabBar = (props: any) => {
      if (isRecruitmentCategory) {
        return null;
      }

      return (
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
    };

    return (
      <View className='flex-1'>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          renderTabBar={renderTabBar}
          onIndexChange={handleIndexChange}
          initialLayout={{ width: layout.width }}
          swipeEnabled={true}
          animationEnabled={false}
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
