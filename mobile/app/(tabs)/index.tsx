import { useEventsFeed } from '../../hooks/useEventsFeed';
import EventsListView from '../../components/EventsListView';

export default function HomeScreen() {
  const {
    events,
    filteredEvents,
    categories,
    selectedCategory,
    refreshing,
    setSelectedCategory,
    handleRefresh,
    handleClearCategory,
  } = useEventsFeed();

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
    />
  );
}
