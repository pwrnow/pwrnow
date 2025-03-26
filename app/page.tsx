import EventFeed from '@/components/event-feed';
import CategorySelector from '@/components/category-selector';

export default function Home() {
  return (
    <>
      <CategorySelector />
      <div className='w-full mt-4 sm:mt-6 transition-all duration-300'>
        <EventFeed />
      </div>
    </>
  );
}
