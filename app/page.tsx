import CategorySelector from '@/components/category-selector';
import Footer from '@/components/footer';
import Logo from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import EventFeed from '@/components/event-feed';

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center bg-background'>
      <div className='w-full mx-auto'>
        <header className='sticky top-0 z-20 w-full bg-background/95 backdrop-blur-md'>
          <div className='flex justify-between items-center p-3 sm:p-4'>
            <div className='w-10'></div> {/* Empty div for balance */}
            <Logo />
            <div className='w-10 flex justify-end'>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <CategorySelector />
        <div className='w-full mt-4 sm:mt-6 transition-all duration-300'>
          <EventFeed />
        </div>
        <Footer />
      </div>
    </main>
  );
}
