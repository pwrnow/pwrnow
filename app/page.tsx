import CategorySelector from '@/components/category-selector';
import Footer from '@/components/footer';
import Logo from '@/components/logo';
import EventFeed from '@/components/event-feed';

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center bg-background'>
      <div className='w-full mx-auto'>
        <header className='sticky top-0 z-10 w-full bg-background/95 backdrop-blur-md border-b border-muted'>
          <div className='flex justify-center p-3 sm:p-4'>
            <Logo />
          </div>
          <CategorySelector />
        </header>
        <div className='w-full'>
          <EventFeed />
        </div>
        <Footer />
      </div>
    </main>
  );
}
