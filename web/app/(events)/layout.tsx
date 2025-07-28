import Header from '@/components/header';
import Footer from '@/components/footer';

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Header />
      <main className='flex-grow w-full mx-auto'>{children}</main>
      <Footer />
    </div>
  );
}
