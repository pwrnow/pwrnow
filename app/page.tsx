import CategorySelector from '@/components/category-selector';
import Footer from '@/components/footer';
import Logo from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import EventFeed from '@/components/event-feed';

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center bg-background'>
      <div className='w-full mx-auto'>
        <header className='sticky top-0 z-10 w-full bg-background/95 backdrop-blur-md border-b border-muted'>
          <div className='flex justify-between items-center p-3 sm:p-4'>
            <div className='w-10'></div> {/* Empty div for balance */}
            <Logo />
            <div className='w-10 flex justify-end'>
              <ThemeToggle />
            </div>
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
