import Header from '@/components/header';
import Footer from '@/components/footer';
import { getUserLocale } from '@/lib/locale';

export default async function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentLocale = await getUserLocale();

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Header currentLocale={currentLocale} />
      <main className='flex-grow w-full mx-auto'>{children}</main>
      <Footer />
    </div>
  );
}
