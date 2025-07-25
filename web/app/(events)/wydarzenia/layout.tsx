import Header from '@/components/header';
import Footer from '@/components/footer';

export default function WydarzeniaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen bg-background flex flex-col'>
      <Header />
      <main className='flex-1 flex flex-col items-center justify-center mt-8'>
        <div className='max-w-2xl w-full mx-auto'>{children}</div>
      </main>
      <Footer />
    </div>
  );
}
