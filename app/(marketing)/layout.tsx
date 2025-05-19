import Header from '@/components/header';
import Footer from '@/components/footer';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Header />
      <main className='flex-grow w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {children}
      </main>
      <Footer />
    </div>
  );
}
