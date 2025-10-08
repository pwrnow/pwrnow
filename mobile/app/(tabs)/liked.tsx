import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useEventsFeed } from '../../hooks/useEventsFeed';
import { t } from '../../lib/i18n';
import EventsListView from '../../components/EventsListView';
import EmptyState from '../../components/EmptyState';

export default function LikedEventsScreen() {
  const { isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const {
    events,
    filteredEvents,
    categories,
    selectedCategory,
    refreshing,
    isFetchingEvents,
    setSelectedCategory,
    handleRefresh,
    handleClearCategory,
  } = useEventsFeed({ filterLiked: true });

  // list filtered events whethe liked or not
  console.log('filteredEvents', filteredEvents.map((event) => event.liked));

  // Show message when user is not authenticated
  if (!isAuthenticated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <EmptyState
          title={t('signInToSeeLikedEvents')}
          message={t('signInToSaveFavoriteEvents')}
        />
      </View>
    );
  }

  // Show message when no liked events
  const showEmptyState = events.length === 0 && !isFetchingEvents;

  return (
    <EventsListView
      events={events}
      filteredEvents={filteredEvents}
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      onClearCategory={handleClearCategory}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      showEmptyState={showEmptyState}
      emptyState={{
        title: t('noLikedEvents'),
        message: t('likeEventsToSeeThemHere'),
      }}
    />
  );
}
