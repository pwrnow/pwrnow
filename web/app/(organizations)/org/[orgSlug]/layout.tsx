import Header from '@/components/header';
import Footer from '@/components/footer';
import { getUserLocale } from '@/lib/locale';
import { Toaster } from 'sonner';

export default async function OrgLayout({
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
      <Toaster />
    </div>
  );
}
