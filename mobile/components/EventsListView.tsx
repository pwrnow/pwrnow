import { View, ScrollView, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';
import { t } from '../lib/i18n';
import EventFeed from './EventFeed';
import CategorySelector from './CategorySelector';
import EmptyState from './EmptyState';
import { Category, Event } from '../types';

interface EventsListViewProps {
  events: Event[];
  filteredEvents: Event[];
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onClearCategory: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  emptyState?: {
    title: string;
    message: string;
  };
  showEmptyState?: boolean;
}

export default function EventsListView({
  events,
  filteredEvents,
  categories,
  selectedCategory,
  onCategoryChange,
  onClearCategory,
  onRefresh,
  refreshing,
  emptyState,
  showEmptyState = false,
}: EventsListViewProps) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const subtleSpinnerColor = isDark ? '#A3A3A3' : '#9CA3AF';

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={Platform.OS === 'ios' ? subtleSpinnerColor : undefined}
      colors={Platform.OS === 'android' ? [subtleSpinnerColor] : undefined}
      progressBackgroundColor={
        Platform.OS === 'android' ? colors.background : undefined
      }
      title={t('refreshingEvents')}
      titleColor={Platform.OS === 'ios' ? subtleSpinnerColor : undefined}
    />
  );

  // Show empty state if needed
  if (showEmptyState && emptyState) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <ScrollView
          style={{ backgroundColor: isDark ? '#000000' : '#FFFFFF' }}
          contentContainerStyle={{
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
            flex: 1,
          }}
          refreshControl={refreshControl}
        >
          <EmptyState title={emptyState.title} message={emptyState.message} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#000000' : '#FFFFFF',
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <ScrollView
        style={{ backgroundColor: isDark ? '#000000' : '#FFFFFF' }}
        contentContainerStyle={{
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
        }}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ backgroundColor: colors.background }} className="pb-2">
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
          />
        </View>
        <EventFeed
          events={filteredEvents}
          selectedCategory={selectedCategory}
          onClearCategory={onClearCategory}
          scrollEnabled={false}
        />
      </ScrollView>
    </View>
  );
}

